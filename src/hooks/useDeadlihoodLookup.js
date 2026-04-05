import { useEffect, useRef, useState } from "react";
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
import {
  formatNumber,
  isFullUkPostcode,
  isPotentialUkPostcode,
  normalizePostcode,
} from "../utils/formatters";

export function useDeadlihoodLookup() {
  const postcodeLookupCacheRef = useRef(new Map());
  const postcodeLookupRequestRef = useRef(0);
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
  const [postError, setPostError] = useState(false);
  const [pressStatus, setPressStatus] = useState(false);
  const [buttonPressed, setButtonPressed] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(false);
  const [connectionReachable, setConnectionReachable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [postcodeSearchMatch, setPostcodeSearchMatch] = useState(null);
  const [postcodeSearchStatus, setPostcodeSearchStatus] = useState("idle");

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

  useEffect(() => {
    const normalizedSearchText = normalizePostcode(searchText);
    const requestId = ++postcodeLookupRequestRef.current;

    if (!searchText.trim()) {
      setPostcodeSearchMatch(null);
      setPostcodeSearchStatus("idle");
      return undefined;
    }

    if (!isPotentialUkPostcode(normalizedSearchText)) {
      setPostcodeSearchMatch(null);
      setPostcodeSearchStatus("idle");
      return undefined;
    }

    if (!isFullUkPostcode(normalizedSearchText)) {
      setPostcodeSearchMatch(null);
      setPostcodeSearchStatus("partial");
      return undefined;
    }

    if (!(connectionStatus && connectionReachable)) {
      setPostcodeSearchMatch(null);
      setPostcodeSearchStatus("offline");
      return undefined;
    }

    const timeoutId = globalThis.setTimeout(async () => {
      const cachedMatch =
        postcodeLookupCacheRef.current.get(normalizedSearchText);

      if (cachedMatch) {
        if (requestId !== postcodeLookupRequestRef.current) {
          return;
        }

        setPostcodeSearchMatch(cachedMatch);
        setPostcodeSearchStatus("resolved");
        return;
      }

      setPostcodeSearchStatus("loading");

      try {
        const adminDistrict =
          await fetchAdminDistrictByPostcode(normalizedSearchText);
        const itemId = locationNameToId[adminDistrict];

        if (requestId !== postcodeLookupRequestRef.current) {
          return;
        }

        if (!itemId) {
          setPostcodeSearchMatch(null);
          setPostcodeSearchStatus("out-of-bounds");
          return;
        }

        const match = {
          label: adminDistrict,
          value: itemId,
        };

        postcodeLookupCacheRef.current.set(normalizedSearchText, match);
        setPostcodeSearchMatch(match);
        setPostcodeSearchStatus("resolved");
      } catch {
        if (requestId !== postcodeLookupRequestRef.current) {
          return;
        }

        setPostcodeSearchMatch(null);
        setPostcodeSearchStatus("invalid");
      }
    }, 300);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [connectionReachable, connectionStatus, searchText]);

  function resetSearchInput() {
    setSearchText("");
    setPostcodeSearchMatch(null);
    setPostcodeSearchStatus("idle");
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

  function getSearchHelperText() {
    switch (postcodeSearchStatus) {
      case "partial":
        return "Keep typing the full postcode to match its administrative area.";
      case "loading":
        return "Looking up postcode...";
      case "resolved":
        return `Postcode matches ${postcodeSearchMatch?.label}. Tap it to run the lookup.`;
      case "invalid":
        return "Postcode not found. Search by area name or enter a full UK postcode.";
      case "out-of-bounds":
        return "This postcode is valid but outside England and Wales.";
      case "offline":
        return "Connect to the internet to search by postcode.";
      default:
        return "Search by administrative area or enter a full postcode.";
    }
  }

  function handleSearchTextChange(text) {
    setSearchText(text);
    setPostError(false);
  }

  function searchQuery(keyword, labelValue) {
    const trimmedKeyword = String(keyword || "").trim();

    if (!trimmedKeyword) {
      return true;
    }

    const normalizedKeyword = normalizePostcode(trimmedKeyword);

    if (isPotentialUkPostcode(normalizedKeyword)) {
      if (!isFullUkPostcode(normalizedKeyword)) {
        return false;
      }

      return postcodeSearchMatch
        ? labelValue === postcodeSearchMatch.label
        : false;
    }

    return labelValue.toLowerCase().includes(trimmedKeyword.toLowerCase());
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
      resetSearchInput();
      setLoading(false);
    }
  }

  async function handleDropdownChange(item) {
    resetLookupState();
    resetSearchInput();
    await runLookup({ itemId: item.value, cityName: item.label });
  }

  return {
    buttonPressed,
    connectionReachable,
    connectionStatus,
    deathRate,
    deathRateEW,
    handleDropdownChange,
    handleSearchTextChange,
    loading,
    locationOptions,
    onHideUnderlay: () => setPressStatus(false),
    onShowUnderlay: () => setPressStatus(true),
    postError,
    searchHelperText: getSearchHelperText(),
    searchQuery,
    pressStatus,
    results: {
      connectionReachable,
      connectionStatus,
      deathRate,
      deathRateEW,
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
    dismissResults,
  };
}
