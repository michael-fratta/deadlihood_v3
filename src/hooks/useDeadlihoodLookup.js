import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import * as SplashScreen from "expo-splash-screen";
import {
  ENGLAND_WALES_POPULATION,
  INITIAL_ADMIN_DATASET_VERSION,
  PLACE_OF_DEATHS,
  SPLASH_DURATION_MS,
} from "../constants/appConfig";
import {
  locationNameToId,
  locationOptions,
  locationPopulationById,
} from "../data/geoData";
import {
  fetchEnglandWalesDeaths,
  fetchLatestAdminDatasetVersion,
  fetchLatestEnglandWalesDatasetVersion,
  fetchLocalAuthorityDeaths,
} from "../services/onsApi";
import { fetchAdminDistrictByPostcode } from "../services/postcodeApi";
import {
  calculateDeadlihoodText,
  calculateDeathRate,
  getLatestObservationLabel,
  getLatestObservationValue,
} from "../utils/deathStatistics";
import { formatNumber, normalizePostcode } from "../utils/formatters";

function createOutOfBoundsError() {
  const error = new Error("Postcode is outside England or Wales");
  error.code = "OUT_OF_BOUNDS";
  return error;
}

export function useDeadlihoodLookup() {
  const textInputRef = useRef(null);
  const [adminDatasetVersion, setAdminDatasetVersion] = useState(
    INITIAL_ADMIN_DATASET_VERSION,
  );
  const [englandWalesDatasetVersion, setEnglandWalesDatasetVersion] =
    useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [totalDeaths, setTotalDeaths] = useState(0);
  const [deathRate, setDeathRate] = useState(0);
  const [totalDeathsEW, setTotalDeathsEW] = useState(0);
  const [stringDeathsEW, setStringDeathsEW] = useState("");
  const [deathRateEW, setDeathRateEW] = useState(0);
  const [stringlihood, setStringlihood] = useState("");
  const [week, setWeek] = useState("");
  const [inputPostcode, setInputPostcode] = useState("");
  const [postError, setPostError] = useState(false);
  const [pressStatus, setPressStatus] = useState(false);
  const [buttonPressed, setButtonPressed] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(false);
  const [connectionReachable, setConnectionReachable] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    SplashScreen.preventAutoHideAsync().catch(() => {});

    const splashTimeout = globalThis.setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, SPLASH_DURATION_MS);

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!isMounted) {
        return;
      }

      setConnectionStatus(Boolean(state.isConnected));
      setConnectionReachable(Boolean(state.isInternetReachable));
    });

    async function initialise() {
      try {
        const [nextAdminVersion, nextEnglandWalesVersion] = await Promise.all([
          fetchLatestAdminDatasetVersion(),
          fetchLatestEnglandWalesDatasetVersion(),
        ]);

        if (!isMounted) {
          return;
        }

        setAdminDatasetVersion(nextAdminVersion);
        setEnglandWalesDatasetVersion(nextEnglandWalesVersion);
      } catch (error) {
        console.error("Failed to initialise dataset versions", error);
      }
    }

    initialise();

    return () => {
      isMounted = false;
      globalThis.clearTimeout(splashTimeout);
      unsubscribe?.();
    };
  }, []);

  function clearPostcodeInput() {
    textInputRef.current?.clear?.();
    setInputPostcode("");
  }

  function resetLookupState() {
    setTotalDeaths(0);
    setDeathRate(0);
    setTotalDeathsEW(0);
    setStringDeathsEW("");
    setDeathRateEW(0);
    setStringlihood("");
    setWeek("");
    setPostError(false);
  }

  function dismissResults() {
    setButtonPressed(true);
  }

  function showInvalidPostcodeAlert() {
    Alert.alert(
      "OOPS!",
      "Something went wrong.\n\nYou either didn't type anything, made a mistake, or used a postcode from a country other than the UK.\n\nPlease try again!",
    );
  }

  function showOutOfBoundsAlert() {
    Alert.alert(
      "OOPS!",
      "Something went wrong.\n\nThe postcode you entered is a valid UK postcode, but it's not within England or Wales.\n\nPlease try again with a different postcode, or use the dropdown menu for a guaranteed result!",
    );
  }

  async function runLookup({ itemId, cityName }) {
    setLoading(true);
    setButtonPressed(false);
    setPostError(false);
    setSelectedItem(itemId);
    setSelectedCity(cityName);

    try {
      const englandWalesVersion =
        englandWalesDatasetVersion ||
        (await fetchLatestEnglandWalesDatasetVersion());
      const localAuthorityVersion =
        adminDatasetVersion || (await fetchLatestAdminDatasetVersion());

      setEnglandWalesDatasetVersion(englandWalesVersion);
      setAdminDatasetVersion(localAuthorityVersion);

      const englandWalesResponse = await fetchEnglandWalesDeaths({
        version: englandWalesVersion,
      });

      const localAuthorityResponses = await Promise.all(
        PLACE_OF_DEATHS.map((placeOfDeath) => {
          return fetchLocalAuthorityDeaths({
            geography: itemId,
            placeOfDeath,
            version: localAuthorityVersion,
          });
        }),
      );

      const nextTotalDeathsEW = getLatestObservationValue(
        englandWalesResponse?.observations,
      );
      const nextTotalDeaths = localAuthorityResponses.reduce(
        (sum, response) =>
          sum + getLatestObservationValue(response?.observations),
        0,
      );
      const nextWeek = getLatestObservationLabel(
        localAuthorityResponses?.[0]?.observations,
      );
      const nextDeathRate = calculateDeathRate(
        nextTotalDeaths,
        locationPopulationById[itemId],
      );
      const nextDeathRateEW = calculateDeathRate(
        nextTotalDeathsEW,
        ENGLAND_WALES_POPULATION,
      );

      setTotalDeaths(nextTotalDeaths);
      setTotalDeathsEW(nextTotalDeathsEW);
      setStringDeathsEW(formatNumber(nextTotalDeathsEW));
      setDeathRate(nextDeathRate);
      setDeathRateEW(nextDeathRateEW);
      setStringlihood(calculateDeadlihoodText(nextDeathRate, nextDeathRateEW));
      setWeek(nextWeek);
    } catch (error) {
      console.error("Lookup failed", error);
      setPostError(true);
      setStringlihood("");
    } finally {
      clearPostcodeInput();
      setLoading(false);
    }
  }

  async function handleDropdownChange(item) {
    resetLookupState();
    await runLookup({ itemId: item.value, cityName: item.label });
  }

  async function handlePostcodeSubmit(event) {
    const normalizedPostcode = normalizePostcode(event?.nativeEvent?.text);
    setInputPostcode(normalizedPostcode);

    if (!normalizedPostcode) {
      setPostError(true);

      if (connectionStatus && connectionReachable) {
        showInvalidPostcodeAlert();
      }

      clearPostcodeInput();
      return;
    }

    resetLookupState();

    try {
      const adminDistrict =
        await fetchAdminDistrictByPostcode(normalizedPostcode);
      const itemId = locationNameToId[adminDistrict];

      if (!itemId) {
        throw createOutOfBoundsError();
      }

      await runLookup({ itemId, cityName: adminDistrict });
    } catch (error) {
      setPostError(true);
      setLoading(false);
      setButtonPressed(true);
      clearPostcodeInput();

      if (!(connectionStatus && connectionReachable)) {
        return;
      }

      if (error.code === "OUT_OF_BOUNDS") {
        showOutOfBoundsAlert();
        return;
      }

      showInvalidPostcodeAlert();
    }
  }

  return {
    buttonPressed,
    connectionReachable,
    connectionStatus,
    deathRate,
    deathRateEW,
    handleDropdownChange,
    handlePostcodeSubmit,
    inputPostcode,
    loading,
    locationOptions,
    onHideUnderlay: () => setPressStatus(false),
    onShowUnderlay: () => setPressStatus(true),
    postError,
    pressStatus,
    results: {
      connectionReachable,
      connectionStatus,
      deathRate,
      deathRateEW,
      inputPostcode,
      postError,
      selectedCity,
      selectedItem,
      stringDeathsEW,
      stringlihood,
      totalDeaths,
      totalDeathsEW,
      week,
    },
    selectedItem,
    textInputRef,
    dismissResults,
  };
}
