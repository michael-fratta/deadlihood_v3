import React, { Component } from "react";
import {
  StyleSheet,
  StatusBar,
  Image,
  View,
  Text,
  TextInput,
  Alert,
  TouchableHighlight,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Dropdown } from "react-native-element-dropdown";
import * as SplashScreen from "expo-splash-screen";
import PreLoader from "./assets/PreLoader.js";
import PostLoader from "./assets/PostLoader.js";
import Array from "./assets/geoName_arr.js";
import Dictionary from "./assets/geoPop_dict.js";
import Dictionary2 from "./assets/geoName_dict.js";
import NetInfo from "@react-native-community/netinfo";

export default class App extends Component {
  NetInfoSubscription = null;

  constructor(props) {
    super(props);

    // Transform Array data for react-native-element-dropdown format
    const dropdownData = Array.map((item) => ({
      label: item.name,
      value: item.id,
    }));

    this.state = {
      data: [], // holds data fetched from API call/s
      dataEW: [], // holds data for total weekly deaths in England and Wales dataset
      currentVersion: "", // holds current version to pass to relevant endpoint in API call
      currentVersionEW: "", // holds current version for total weekly deaths in England and Wales dataset
      isLoading: true, // set to false after API call to indicate call is done
      selectedItem: "", // holds id (see geoPop_dict) of location selected by user
      selectedCity: "", // holds name (see geoPop_dict) of location selected by user
      placeOfDeath: "", // holds place of death to pass to relevant endpoint in API call
      totalDeaths: 0, // holds total deaths
      deathRate: 0, // holds death rate for given location
      totalDeathsEW: 0, // holds total weekly deaths for whole EW
      stringDeathsEW: "", // holds totalDeathsEW stringified with commas
      deathRateEW: 0, // holds death rate for whole EW
      deadlihood: 0, // holds deadlihood
      loading: false, // holds boolean for loading state
      stringlihood: "", // string deadlihood (for percentage and more/less than)
      week: "", // get week number so data is more transparent
      inputPostcode: "", // get postcode
      isClear: false, //boolean for postcode input, to change state if same postcode is input
      postState: 0, //counter so state updates if same postcode is input
      dropState: 0, //counter to prevent both conditions within componentDidUpdate to run simultaneously when postcode is first input
      postError: false, //handle incorrect postcode
      pressStatus: false, // for top_icon press status
      buttonPressed: true, // for press status of top_icon to control PostLoader
      currentYear: 0, // initialise the current Year
      connection_status: false, // initialise connection status to false
      connection_reachable: false, // initialise connection reachable to false
      isProcessing: false, // flag to prevent re-entering componentDidUpdate while processing
      dropdownData: dropdownData, // formatted data for dropdown
    };
  }

  // to handle press status of top_icon
  _onHideUnderlay() {
    this.setState({ pressStatus: false });
  }
  _onShowUnderlay() {
    this.setState({ pressStatus: true });
  }

  // Custom render function for dropdown items
  renderDropdownItem = (item) => {
    return (
      <View style={styles.dropdownItem}>
        <Text style={styles.dropdownItemText}>{item.label}</Text>
      </View>
    );
  };

  async getCurrentYear() {
    let curr = new Date().getFullYear();
    this.setState({ currentYear: curr });
  }

  // getter for current version of weekly deaths per administrative area dataset. Executed at runtime to avoid null error
  async getCurrentVersion() {
    const url = `https://api.beta.ons.gov.uk/v1/datasets/weekly-deaths-local-authority/editions/2023/versions`;
    try {
      console.log("DEBUG: Fetching version from:", url);
      const response = await fetch(url);
      console.log(
        "DEBUG: fetch response status:",
        response.status,
        response.ok,
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const responseJson = await response.json();
      const mapped = responseJson.items.map(function (vers) {
        //JSON is unnumbered so needs to be mapped
        return vers;
      });
      console.log("DEBUG: Setting currentVersion to:", mapped[0]["version"]);
      this.setState({ currentVersion: mapped[0]["version"] });
    } catch (error) {
      console.error("DEBUG: ERROR in getCurrentVersion:", error);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  // getter for current version of total weekly deaths for England and Wales dataset. Executed at runtime to avoid null error
  async getCurrentVersionEW() {
    const url =
      "https://api.beta.ons.gov.uk/v1/datasets/weekly-deaths-age-sex/editions/covid-19/versions";
    try {
      console.log("DEBUG: Fetching EW version from:", url);
      const response = await fetch(url);
      console.log(
        "DEBUG: EW fetch response status:",
        response.status,
        response.ok,
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const responseJson = await response.json();
      const mapped = responseJson.items.map(function (vers) {
        //JSON is unnumbered so needs to be mapped
        return vers;
      });
      console.log("DEBUG: Setting currentVersionEW to:", mapped[0]["version"]);
      this.setState({ currentVersionEW: mapped[0]["version"] });
    } catch (error) {
      console.error("DEBUG: ERROR in getCurrentVersionEW:", error);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  // initialise function to change state of placeOfDeath (to insert as endpoint in API call)
  async setPlaceOfDeath(place) {
    return new Promise((resolve) => {
      this.setState({ placeOfDeath: place }, resolve);
    });
  }

  // setter for place of death: hospital
  async setHospital() {
    console.log("DEBUG: setHospital called");
    await this.setPlaceOfDeath("hospital");
  }

  // setter for place of death: home
  async setHome() {
    await this.setPlaceOfDeath("home");
  }

  // setter for place of death: care home
  async setCareHome() {
    await this.setPlaceOfDeath("care-home");
  }

  // setter for place of death: hospice
  async setHospice() {
    await this.setPlaceOfDeath("hospice");
  }

  // setter for place of death: elsewhere
  async setElsewhere() {
    await this.setPlaceOfDeath("elsewhere");
  }

  // setter for place of death: other
  async setOther() {
    await this.setPlaceOfDeath("other-communal-establishment");
  }

  // setter for totalling deaths, for each place of death, for the current week
  async setTotalDeaths(data) {
    return new Promise((resolve) => {
      console.log(
        "DEBUG: setTotalDeaths called with data observations:",
        data?.observations?.length,
      );
      if (this.state.selectedItem !== "" && this.state.postError === false) {
        //only run the below code if postcode is correct (prevents null error)
        let deaths = data.observations.map(function (count) {
          return count;
        });

        let deathNum = 0;
        deathNum += parseInt(deaths[deaths.length - 1].observation); // gets current week and adds it to deathNum local variable
        deathNum += this.state.totalDeaths; // adds deathNum local variable to totalDeaths global variable

        let weekNum = deaths[deaths.length - 1].dimensions.Week.label; // get current week number
        this.setState({ totalDeaths: deathNum, week: weekNum }, () => {
          console.log(this.state.week + " <-- this is the current week");
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // setter for current total weekly deaths in England and Wales
  async setTotalDeathsEW(dataEW) {
    return new Promise((resolve) => {
      console.log(
        "DEBUG: setTotalDeathsEW called with dataEW observations:",
        dataEW?.observations?.length,
      );
      try {
        let mapped = dataEW.observations.map(function (count) {
          return count;
        });
        let total = 0;
        let i = 0;
        while (mapped[i].observation !== "") {
          total = parseInt(mapped[i].observation);
          i = i + 1;
        }
        console.log("DEBUG: setTotalDeathsEW calculated total:", total);
        // Combine both setState calls into one with a callback to ensure atomicity
        this.setState(
          {
            stringDeathsEW: total
              .toString()
              .replace(/\B(?=(\d{3})+(?!\d))/g, ","),
            totalDeathsEW: total,
          },
          resolve,
        );
      } catch (error) {
        console.error("DEBUG: ERROR in setTotalDeathsEW:", error);
        resolve();
      }
    });
  }

  // reset totalDeaths back to 0
  async resetDeaths() {
    return new Promise((resolve) => {
      console.log("DEBUG: resetDeaths called");
      this.setState({ totalDeaths: 0 }, resolve);
    });
  }

  // interval setter function that uses PreLoader component to set how long loading gif should display for
  async _setInterval() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.setState({ loading: false }, resolve);
      }, 500); // minimal delay to ensure all state updates have propagated
    });
  }

  // to stop endless gif loop if same location is selected
  setIntervalIfTrue() {
    if (this.state.loading) {
      this._setInterval();
    }
  }

  // initial screen - executed at runtime
  async componentDidMount() {
    this.NetInfoSubscription = NetInfo.addEventListener(
      this._handleConnectivityChange,
    );

    await this.getCurrentYear(); // get current year

    SplashScreen.preventAutoHideAsync(); // prevent splashscreen from hiding automatically
    setTimeout(() => SplashScreen.hideAsync(), 3000); // stay for 3 secs

    await this.getCurrentVersion(); // initialise current version endpoint for administrative area dataset to avoid null error
    console.log(
      this.state.currentVersion +
        " <-- this is the current version of the administrative dataset",
    );

    await this.getCurrentVersionEW(); // initialise current version endpoint for England and Wales dataset to avoid null error
    console.log(
      this.state.currentVersionEW +
        " <-- this is the current version of the England and Wales dataset",
    );

    console.log(
      this.state.connection_status +
        " <-- this is connection_status in componentDidMount",
    );
    console.log(
      this.state.connection_reachable +
        " <-- this is connection_reachable in componentDidMount",
    );
  }

  _handleConnectivityChange = (state) => {
    this.setState({
      connection_status: state.isConnected,
      connection_reachable: state.isInternetReachable,
    });
    console.log(
      this.state.connection_status +
        " <-- this is connection_status in _handleConnectivityChange",
    );
    console.log(
      this.state.connection_reachable +
        " <-- this is connection_reachable in _handleConnectivityChange",
    );
  };

  // getter for administrative area by postcode
  async getAdminDist() {
    return new Promise((resolve) => {
      const url = `https://api.postcodes.io/postcodes/${this.state.inputPostcode}`;
      fetch(url)
        .then((response) => response.json())
        .then((responseJson) => {
          this.setState(
            {
              selectedCity: responseJson.result.admin_district,
              postError: false,
              isLoading: false,
            },
            resolve,
          ); //set postError to false as call was successful
        })
        .catch(() => {
          this.setState({ postError: true, isLoading: false }, resolve); //set postError to true as call was unsuccessful
        });
    });
  }

  //setter for selectedItem by selectedCity
  async setItem() {
    return new Promise((resolve) => {
      let city = this.state.selectedCity;
      let item = Dictionary2[city];
      this.setState({ selectedItem: item }, resolve);
    });
  }

  //clear inputPostcode to deal with fact that alert is not popping up even if no postcode is input, after postcode was already input (because state remembers)
  async clearPostcode() {
    return new Promise((resolve) => {
      this.setState({ inputPostcode: "" }, resolve);
    });
  }

  // getter for weekly deaths of chosen administrative area dataset
  async getData() {
    try {
      const url = `https://api.beta.ons.gov.uk/v1/datasets/weekly-deaths-local-authority/editions/2023/versions/50/observations?time=2023&geography=${this.state.selectedItem}&week=*&causeofdeath=all-causes&placeofdeath=${this.state.placeOfDeath}&registrationoroccurrence=registrations`;
      console.log("DEBUG: getData fetching from:", url);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const responseJson = await response.json();
      console.log(
        "DEBUG: getData received response, observations count:",
        responseJson.observations?.length,
      );
      responseJson.observations.sort(function (a, b) {
        //JSON is unsorted, so requires sorting
        return parseInt(a.dimensions.Week.label.slice(5)) <
          parseInt(b.dimensions.Week.label.slice(5))
          ? -1 //remove "Week" from label, so only number is compared
          : parseInt(a.dimensions.Week.label.slice(5)) >
              parseInt(b.dimensions.Week.label.slice(5))
            ? 1
            : 0; //was not sorting in 'natural order'
      });
      console.log("DEBUG: getData setting state with data");
      this.setState({ data: responseJson, postError: false }); //set postError to false as call was successful
      return responseJson; // Return the data for immediate use
    } catch (error) {
      console.error("DEBUG: ERROR in getData:", error);
      this.setState({ postError: true }); //set postError to true as call was unsuccessful
    } finally {
      this.setState({ isLoading: false });
    }
  }

  // getter for weekly deaths of England and Wales dataset
  async getDataEW() {
    try {
      const url = `https://api.beta.ons.gov.uk/v1/datasets/weekly-deaths-age-sex/editions/covid-19/versions/${this.state.currentVersionEW}/observations?time=2023&geography=K04000001&week=*&sex=all&agegroups=all-ages&deaths=total-registered-deaths`;
      console.log("DEBUG: getDataEW fetching from:", url);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const responseJson = await response.json();
      console.log(
        "DEBUG: getDataEW received response, observations count:",
        responseJson.observations?.length,
      );
      responseJson.observations.sort(function (a, b) {
        //JSON is unsorted, so requires sorting
        return parseInt(a.dimensions.Week.label.slice(5)) <
          parseInt(b.dimensions.Week.label.slice(5))
          ? -1 //remove "Week" from label, so only number is compared
          : parseInt(a.dimensions.Week.label.slice(5)) >
              parseInt(b.dimensions.Week.label.slice(5))
            ? 1
            : 0; //was not sorting in 'natural order'
      });
      console.log("DEBUG: getDataEW setting state with dataEW");
      this.setState({ dataEW: responseJson });
      return responseJson; // Return the data for immediate use
    } catch (error) {
      console.error("DEBUG: ERROR in getDataEW:", error);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  // setter for death rate of a given location
  async setDeathRate() {
    return new Promise((resolve) => {
      let rate = (
        (this.state.totalDeaths / Dictionary[this.state.selectedItem]) *
        10000
      ).toFixed(2); // get total deaths, divide by pop of selected item, round to 2sf
      this.setState({ deathRate: rate }, resolve);
    });
  }

  // setter for death rate of England and Wales
  async setDeathRateEW() {
    return new Promise((resolve) => {
      let rate = ((this.state.totalDeathsEW / 59641829) * 10000).toFixed(2); //total pop of England and Wales is hardcoded as updated infrequently. Last update Dec 2022. Next update Feb 2024 (provisional) See https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/populationestimatesforukenglandandwalesscotlandandnorthernireland
      this.setState({ deathRateEW: rate }, resolve);
    });
  }

  // calculating the deadlihood
  async setDeadlihood() {
    console.log(
      "DEBUG: setDeadlihood called, deathRate:",
      this.state.deathRate,
      "deathRateEW:",
      this.state.deathRateEW,
    );
    return new Promise((resolve) => {
      let percentage =
        100 -
        ((this.state.deathRate / this.state.deathRateEW) * 100).toFixed(0); // round to nearest whole
      if (percentage < 0) {
        percentage *= -1;
        this.setState(
          {
            stringlihood: percentage + "% more",
            loading: false,
            isProcessing: false,
          },
          () => {
            console.log(
              "DEBUG: PreLoader hidden, PostLoader showing with stringlihood:",
              this.state.stringlihood,
            );
            resolve();
          },
        );
      } else {
        this.setState(
          {
            stringlihood: percentage + "% less",
            loading: false,
            isProcessing: false,
          },
          () => {
            console.log(
              "DEBUG: PreLoader hidden, PostLoader showing with stringlihood:",
              this.state.stringlihood,
            );
            resolve();
          },
        );
      }
    });
  }

  //so state updates when same postcode is selected - called in onEndEditing
  postStateUpdate() {
    let counter = this.state.postState;
    counter += 1;
    console.log(
      "DEBUG: postStateUpdate called, setting postState to:",
      counter,
    );
    this.setState({ postState: counter });
  }

  //doing the same for dropdown as it was running simultaneously with first postcode input
  dropStateUpdate() {
    let counter = this.state.dropState;
    counter += 1;
    console.log(
      "DEBUG: dropStateUpdate called, setting dropState to:",
      counter,
    );
    this.setState({ dropState: counter });
  }

  // runs after item is selected or postcode is input
  async componentDidUpdate(prevProps, prevState) {
    console.log("DEBUG: componentDidUpdate called", {
      dropState: { current: this.state.dropState, prev: prevState.dropState },
      postState: { current: this.state.postState, prev: prevState.postState },
      isProcessing: this.state.isProcessing,
    });

    // Check if we're already processing to avoid re-entering
    if (this.state.isProcessing) {
      console.log("DEBUG: Already processing, skipping");
      return;
    }

    if (this.state.dropState !== prevState.dropState) {
      console.log("DEBUG: ENTERING DROPDOWN HANDLER BLOCK");
      // Set flags immediately to prevent re-entry and show loading
      this.setState({
        isProcessing: true,
        buttonPressed: false,
        loading: true,
      });

      console.log("DEBUG: Starting getDataEW");
      const dataEW = await this.getDataEW(); // get England and Wales deaths dataset - was causing unhandled promise rejection in componentDidMount
      console.log("DEBUG: Finished getDataEW");
      await this.setTotalDeathsEW(dataEW); // set total deaths for England and Wales dataset - was causing unhandled promise rejection in componentDidMount

      await this.resetDeaths(); // reset totalDeaths in case new location selected

      await this.setHospital(); // set to hospital to get hospital deaths
      const data = await this.getData(); // get the data with the relevant place of death
      await this.setTotalDeaths(data); // update the totalDeaths

      // repeat for home
      await this.setHome();
      const dataHome = await this.getData();
      await this.setTotalDeaths(dataHome);

      // repeat for hospice
      await this.setHospice();
      const dataHospice = await this.getData();
      await this.setTotalDeaths(dataHospice);

      // repeat for elsewhere
      await this.setElsewhere();
      const dataElsewhere = await this.getData();
      await this.setTotalDeaths(dataElsewhere);

      // repeat for other
      await this.setOther();
      const dataOther = await this.getData();
      await this.setTotalDeaths(dataOther);

      // repeat for care home
      await this.setCareHome();
      const dataCareHome = await this.getData();
      await this.setTotalDeaths(dataCareHome);

      // set death rates
      await this.setDeathRate();
      await this.setDeathRateEW();

      console.log("DEBUG: About to call setDeadlihood");
      await this.setDeadlihood(); //set deadlihood (this will hide PreLoader)
      console.log("DEBUG: setDeadlihood completed");

      this.textInput.clear(); // clear postcode in case dropdown item is selected instead

      await this.clearPostcode(); //clear inputPostcode from state

      console.log(
        this.state.selectedItem + " <-- this is the administrative area code",
      );
    } else if (this.state.postState !== prevState.postState) {
      // Set flags immediately to prevent re-entry and show loading
      this.setState({
        isProcessing: true,
        buttonPressed: false,
        loading: true,
      });

      const dataEW = await this.getDataEW(); // get England and Wales deaths dataset - was causing unhandled promise rejection in componentDidMount

      await this.setTotalDeathsEW(dataEW); // set total deaths for England and Wales dataset - was causing unhandled promise rejection in componentDidMount

      await this.getAdminDist(); // get admin dist name of postcode

      if (
        this.state.postError === true &&
        this.state.connection_status === true &&
        this.state.connection_reachable === true
      ) {
        //Alert if postcode is invalid (and device is connected)
        Alert.alert(
          "OOPS!",
          "Something went wrong.\n\nYou either didn't type anything, made a mistake, or used a postcode from a country other than the UK.\n\nPlease try again!",
        );
        this.textInput.clear(); //clear postcode from TextInput
        this.clearPostcode(); //clear postcode from state
      } else if (
        this.state.postError === true &&
        this.state.connection_status === false &&
        this.state.connection_reachable === false
      ) {
        // just clear poscode from textinput and state, if postcode was wrong previously and cthere is no connection
        this.textInput.clear();
        this.clearPostcode();
      } else {
        await this.setItem(); // get item of dist name of postcode

        await this.resetDeaths(); // reset totalDeaths in case new location selected

        await this.setHospital(); // set to hospital again in case new location selected (componendDidMount will not run again)
        let dataInitial = await this.getData(); // get the data with the relevant place of death

        if (
          this.state.postError === true &&
          this.state.connection_status === true &&
          this.state.connection_reachable === true
        ) {
          //Alert if postcode is out of bounds (and device is connected)
          Alert.alert(
            "OOPS!",
            "Something went wrong.\n\nThe postcode you entered is a valid UK postcode, but it's not within England or Wales.\n\nPlease try again with a different postcode, or use the dropdown menu for a guaranteed result!",
          );
          this.textInput.clear(); //clear postcode from TextInput
          this.clearPostcode(); //clear postcode from state
        } else {
          await this.setTotalDeaths(dataInitial); // update the totalDeaths

          // repeat for home
          await this.setHome();
          const dataHome = await this.getData();
          await this.setTotalDeaths(dataHome);

          // repeat for hospice
          await this.setHospice();
          const dataHospice = await this.getData();
          await this.setTotalDeaths(dataHospice);

          // repeat for elsewhere
          await this.setElsewhere();
          const dataElsewhere = await this.getData();
          await this.setTotalDeaths(dataElsewhere);

          // repeat for other
          await this.setOther();
          const dataOther = await this.getData();
          await this.setTotalDeaths(dataOther);

          // repeat for care home
          await this.setCareHome();
          const dataCareHome = await this.getData();
          await this.setTotalDeaths(dataCareHome);

          // set death rates
          await this.setDeathRate();
          await this.setDeathRateEW();

          console.log("DEBUG: About to call setDeadlihood");
          await this.setDeadlihood(); //set deadlihood (this will hide PreLoader)
          console.log("DEBUG: setDeadlihood completed");

          this.textInput.clear(); //clear postcode after being submitted

          await this.clearPostcode(); //clear inputPostcode from state

          console.log(
            this.state.selectedItem +
              " <-- this is the administrative area code",
          );
        }
      }
    }
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#602883" />
        <View style={styles.container}>
          {/* Overlayed PostLoader, only visible when buttonPressed is false and not loading */}
          {this.state.buttonPressed !== true && !this.state.loading && (
            <View style={styles.postLoaderOverlay} pointerEvents="auto">
              <View style={styles.postLoaderCenterer}>
                <PostLoader {...this.state} />
              </View>
            </View>
          )}

          {/* Top icon is hidden when PreLoader is visible */}
          {!this.state.loading && (
            <TouchableHighlight
              onPress={() => {
                this.setState({ buttonPressed: true });
              }}
              activeOpacity={1}
              style={[
                this.state.pressStatus ? styles.imagePress : styles.image,
                { zIndex: 2, position: "relative" },
              ]}
              onHideUnderlay={this._onHideUnderlay.bind(this)}
              onShowUnderlay={this._onShowUnderlay.bind(this)}
            >
              <Image
                style={
                  this.state.pressStatus ? styles.imagePress : styles.image
                }
                source={require("./assets/top_icon.png")}
              />
            </TouchableHighlight>
          )}

          {/* Main content */}
          <Text style={styles.titleText}>
            Select an administrative area of England or Wales below
          </Text>

          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            containerStyle={styles.dropdownContainer}
            data={this.state.dropdownData}
            search
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="select a location"
            searchPlaceholder="search..."
            value={this.state.selectedItem}
            focusedBorderColor="transparent"
            onChange={(item) => {
              console.log("DEBUG: Dropdown item selected:", item);
              this.setState({
                loading: true,
                selectedItem: item.value,
                selectedCity: item.label,
                postError: false,
              });
              this.dropStateUpdate(); //run function that adds to counter each time item is selected, to update state correctly
            }}
            renderItem={this.renderDropdownItem}
            activeColor="#10c62d"
          />

          <Text style={styles.titleText}>
            or input an English or Welsh postcode instead
          </Text>
          <TextInput
            style={styles.input}
            ref={(input) => {
              this.textInput = input;
            }}
            onSubmitEditing={(postcode) => {
              console.log(
                "DEBUG: Postcode submitted:",
                postcode.nativeEvent.text,
              );
              let str = postcode.nativeEvent.text;
              str = str.replace(/\s+/g, "").toUpperCase(); //remove whitespace and convert to uppercase (for correct API use)
              this.setState({ inputPostcode: str, loading: true });
              this.postStateUpdate(); //call counter function to update state each time postcode is input, even if it's the same one
            }}
            placeholder="input full postcode"
            placeholderTextColor="#4fff6b"
            placeholderStyle={styles.placeholderStyle}
            underlineColorAndroid="transparent"
            color="#10c62d"
            autoCompleteType="postal-code"
          />

          {/* PreLoader stays above everything if loading */}
          <PreLoader preLoaderVisible={this.state.loading} />
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    //marginTop: StatusBar.currentHeight || 0,
    backgroundColor: "#602883",
    alignItems: "center",
  },
  dropdown: {
    padding: 12,
    borderRadius: 10,
    maxWidth: "80%",
    minWidth: "75%",
    backgroundColor: "#a446de",
    marginTop: 5,
  },
  dropdownContainer: {
    borderWidth: 2,
    borderColor: "#10c62d",
    borderRadius: 8,
    backgroundColor: "#a446de",
  },
  selectedTextStyle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#10c62d",
  },
  inputSearchStyle: {
    height: 40,
    width: "auto",
    borderColor: "white",
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    fontSize: 16,
    fontWeight: "bold",
    backgroundColor: "#602883",
    textShadowColor: "black",
    textShadowRadius: 5,
  },
  placeholderStyle: {
    fontSize: 14,
    color: "#4fff6b",
  },
  iconStyle: {
    width: 20,
    height: 20,
    tintColor: "#10c62d",
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#10c62d",
    backgroundColor: "#a446de",
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#10c62d",
    textShadowColor: "black",
    textShadowRadius: 5,
  },
  titleText: {
    fontSize: 20,
    textAlign: "center",
    fontWeight: "bold",
    color: "#10c62d",
    marginBottom: 5,
    paddingTop: 25,
    textShadowColor: "black",
    textShadowRadius: 10,
    padding: 10,
    margin: 50,
  },
  image: {
    marginTop: 20,
    width: 120,
    height: 120,
  },
  imagePress: {
    width: 130,
    height: 130,
  },
  input: {
    padding: 12,
    borderRadius: 10,
    maxWidth: "80%",
    minWidth: "75%",
    backgroundColor: "#a446de",
    marginTop: 5,
  },
  postLoaderOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "#602883", // fully opaque purple
  },
  postLoaderCenterer: {
    marginTop: "43%",
    alignItems: "center",
    width: "100%",
  },
});
