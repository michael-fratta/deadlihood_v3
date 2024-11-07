import React, { Component } from "react";
import {
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Image,
  View,
  Text,
  TextInput,
  Alert,
  TouchableHighlight,
} from "react-native";
import SearchableDropdown from "react-native-searchable-dropdown";
import * as SplashScreen from "expo-splash-screen";
import PreLoader from "./assets/PreLoader.js";
import PostLoader from "./assets/PostLoader.js";
import { Tooltip } from "react-native-elements";
import Array from "./assets/geoName_arr.js";
import Dictionary from "./assets/geoPop_dict.js";
import Dictionary2 from "./assets/geoName_dict.js";
import NetInfo from "@react-native-community/netinfo";

export default class App extends Component {
  NetInfoSubscription = null;

  constructor(props) {
    super(props);
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
    };
  }

  // to handle press status of top_icon
  _onHideUnderlay() {
    this.setState({ pressStatus: false });
  }
  _onShowUnderlay() {
    this.setState({ pressStatus: true });
  }

  async getCurrentYear() {
    let curr = new Date().getFullYear();
    this.setState({ currentYear: curr });
  }

  // getter for current version of weekly deaths per administrative area dataset. Executed at runtime to avoid null error
  async getCurrentVersion() {
    const url = `https://api.beta.ons.gov.uk/v1/datasets/weekly-deaths-local-authority/editions/2023/versions`;
    await fetch(url)
      .then((response) => response.json())
      .then((responseJson) => {
        const mapped = responseJson.items.map(function (vers) {
          //JSON is unnumbered so needs to be mapped
          return vers;
        });
        this.setState({ currentVersion: mapped[0]["version"] });
      })
      .catch((error) => console.error(error))
      .finally(() => {
        this.setState({ isLoading: false });
      });
  }

  // getter for current version of total weekly deaths for England and Wales dataset. Executed at runtime to avoid null error
  async getCurrentVersionEW() {
    const url =
      "https://api.beta.ons.gov.uk/v1/datasets/weekly-deaths-age-sex/editions/covid-19/versions";
    await fetch(url)
      .then((response) => response.json())
      .then((responseJson) => {
        const mapped = responseJson.items.map(function (vers) {
          //JSON is unnumbered so needs to be mapped
          return vers;
        });
        this.setState({ currentVersionEW: mapped[0]["version"] });
      })
      .catch((error) => console.error(error))
      .finally(() => {
        this.setState({ isLoading: false });
      });
  }

  // initialise function to change state of placeOfDeath (to insert as endpoint in API call)
  async setPlaceOfDeath(place) {
    this.setState({ placeOfDeath: place });
  }

  // setter for place of death: hospital
  async setHospital() {
    this.setPlaceOfDeath("hospital");
  }

  // setter for place of death: home
  async setHome() {
    this.setPlaceOfDeath("home");
  }

  // setter for place of death: care home
  async setCareHome() {
    this.setPlaceOfDeath("care-home");
  }

  // setter for place of death: hospice
  async setHospice() {
    this.setPlaceOfDeath("hospice");
  }

  // setter for place of death: elsewhere
  async setElsewhere() {
    this.setPlaceOfDeath("elsewhere");
  }

  // setter for place of death: other
  async setOther() {
    this.setPlaceOfDeath("other-communal-establishment");
  }

  // setter for totalling deaths, for each place of death, for the current week
  async setTotalDeaths() {
    if (this.state.selectedItem !== "" && this.state.postError === false) {
      //only run the below code if postcode is correct (prevents null error)
      let deaths = await this.state.data.observations.map(function (count) {
        return count;
      });

      let deathNum = 0;
      deathNum += parseInt(deaths[deaths.length - 1].observation); // gets current week and adds it to deathNum local variable
      deathNum += this.state.totalDeaths; // adds deathNum local variable to totalDeaths global variable
      this.setState({ totalDeaths: deathNum }); // sets totalDeaths global variable to deathNum local variable

      let weekNum = deaths[deaths.length - 1].dimensions.Week.label; // get current week number
      this.setState({ week: weekNum }); // set current week number
      console.log(this.state.week + " <-- this is the current week");
    }
  }

  // setter for current total weekly deaths in England and Wales
  async setTotalDeathsEW() {
    let mapped = await this.state.dataEW.observations.map(function (count) {
      return count;
    });
    let total = 0;
    i = 0;
    while (mapped[i].observation !== "") {
      total = parseInt(mapped[i].observation);
      i = i + 1;
    }
    this.setState({
      stringDeathsEW: total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
    });
    this.setState({ totalDeathsEW: total });
  }

  // reset totalDeaths back to 0
  async resetDeaths() {
    this.setState({ totalDeaths: 0 });
  }

  // interval setter function that uses PreLoader component to set how long loading gif should display for
  async _setInterval() {
    setTimeout(() => {
      this.setState({
        loading: false,
      });
    }, 5000); // run for 5 secs
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
      this._handleConnectivityChange
    );

    await this.getCurrentYear(); // get current year

    SplashScreen.preventAutoHideAsync(); // prevent splashscreen from hiding automatically
    setTimeout(() => SplashScreen.hideAsync(), 3000); // stay for 3 secs

    await this.getCurrentVersion(); // initialise current version endpoint for administrative area dataset to avoid null error
    console.log(
      this.state.currentVersion +
        " <-- this is the current version of the administrative dataset"
    );

    await this.getCurrentVersionEW(); // initialise current version endpoint for England and Wales dataset to avoid null error
    console.log(
      this.state.currentVersionEW +
        " <-- this is the current version of the England and Wales dataset"
    );

    console.log(
      this.state.connection_status +
        " <-- this is connection_status in componentDidMount"
    );
    console.log(
      this.state.connection_reachable +
        " <-- this is connection_reachable in componentDidMount"
    );
  }

  _handleConnectivityChange = (state) => {
    this.setState({
      connection_status: state.isConnected,
      connection_reachable: state.isInternetReachable,
    });
    console.log(
      this.state.connection_status +
        " <-- this is connection_status in _handleConnectivityChange"
    );
    console.log(
      this.state.connection_reachable +
        " <-- this is connection_reachable in _handleConnectivityChange"
    );
  };

  // getter for administrative area by postcode
  async getAdminDist() {
    const url = `https://api.postcodes.io/postcodes/${this.state.inputPostcode}`;
    await fetch(url)
      .then((response) => response.json())
      .then((responseJson) => {
        this.setState({
          selectedCity: responseJson.result.admin_district,
          postError: false,
        }); //set postError to false as call was successful
      })
      .catch(() => {
        this.setState({ postError: true }); //set postError to true as call was unsuccessful
      })
      .finally(() => {
        this.setState({ isLoading: false });
      });
  }

  //setter for selectedItem by selectedCity
  async setItem() {
    let city = this.state.selectedCity;
    let item = Dictionary2[city];
    this.setState({ selectedItem: item });
  }

  //clear inputPostcode to deal with fact that alert is not popping up even if no postcode is input, after postcode was already input (because state remembers)
  async clearPostcode() {
    this.setState({ inputPostcode: "" });
  }

  // getter for weekly deaths of chosen administrative area dataset
  async getData() {
    const url = `https://api.beta.ons.gov.uk/v1/datasets/weekly-deaths-local-authority/editions/2023/versions/50/observations?time=2023&geography=${this.state.selectedItem}&week=*&causeofdeath=all-causes&placeofdeath=${this.state.placeOfDeath}&registrationoroccurrence=registrations`;
    await fetch(url)
      .then((response) => response.json())
      .then((responseJson) => {
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
        this.setState({ data: responseJson, postError: false }); //set postError to false as call was successful
      })
      .catch(() => {
        this.setState({ postError: true }); //set postError to true as call was unsuccessful
      })
      .finally(() => {
        this.setState({ isLoading: false });
      });
  }

  // getter for weekly deaths of England and Wales dataset
  async getDataEW() {
    const url = `https://api.beta.ons.gov.uk/v1/datasets/weekly-deaths-age-sex/editions/covid-19/versions/${this.state.currentVersionEW}/observations?time=2023&geography=K04000001&week=*&sex=all&agegroups=all-ages&deaths=total-registered-deaths`;
    await fetch(url)
      .then((response) => response.json())
      .then((responseJson) => {
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
        this.setState({ dataEW: responseJson });
      })
      .catch((error) => console.error(error))
      .finally(() => {
        this.setState({ isLoading: false });
      });
  }

  // setter for death rate of a given location
  async setDeathRate() {
    let rate = (
      (this.state.totalDeaths / Dictionary[this.state.selectedItem]) *
      10000
    ).toFixed(2); // get total deaths, divide by pop of selected item, round to 2sf
    this.setState({ deathRate: rate });
  }

  // setter for death rate of England and Wales
  async setDeathRateEW() {
    let rate = ((this.state.totalDeathsEW / 59641829) * 10000).toFixed(2); //total pop of England and Wales is hardcoded as updated infrequently. Last update Dec 2022. Next update Feb 2024 (provisional) See https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/populationestimatesforukenglandandwalesscotlandandnorthernireland
    this.setState({ deathRateEW: rate });
  }

  // calculating the deadlihood
  async setDeadlihood() {
    let percentage =
      100 - ((this.state.deathRate / this.state.deathRateEW) * 100).toFixed(0); // round to nearest whole
    if (percentage < 0) {
      percentage *= -1;
      this.setState({ stringlihood: percentage + "% more" });
    } else {
      this.setState({ stringlihood: percentage + "% less" });
    }
  }

  //so state updates when same postcode is selected - called in onEndEditing
  postStateUpdate() {
    let counter = this.state.postState;
    counter += 1;
    this.setState({ postState: counter });
  }

  //doing the same for dropdown as it was running simultaneously with first postcode input
  dropStateUpdate() {
    let counter = this.state.dropState;
    counter += 1;
    this.setState({ dropState: counter });
  }

  // runs after item is selected or postcode is input
  async componentDidUpdate(prevProps, prevState) {
    this.setIntervalIfTrue(); // to stop endless loader loop if same location is selected

    if (this.state.dropState !== prevState.dropState) {
      this.setState({ buttonPressed: false }); // set button pressed to false after state change

      await this.getDataEW(); // get England and Wales deaths dataset - was causing unhandled promise rejection in componentDidMount
      await this.setTotalDeathsEW(); // set total deaths for England and Wales dataset - was causing unhandled promise rejection in componentDidMount

      await this.resetDeaths(); // reset totalDeaths in case new location selected

      await this.setHospital(); // set to hospital to get hospital deaths
      await this.getData(); // get the data with the relevant place of death
      await this.setTotalDeaths(); // update the totalDeaths

      // repeat for home
      await this.setHome();
      await this.getData();
      await this.setTotalDeaths();

      // repeat for hospice
      await this.setHospice();
      await this.getData();
      await this.setTotalDeaths();

      // repeat for elsewhere
      await this.setElsewhere();
      await this.getData();
      await this.setTotalDeaths();

      // repeat for other
      await this.setOther();
      await this.getData();
      await this.setTotalDeaths();

      // repeat for care home
      await this.setCareHome();
      await this.getData();
      await this.setTotalDeaths();

      // set death rates
      await this.setDeathRate();
      await this.setDeathRateEW();

      await this.setDeadlihood(); //set deadlihood

      await this._setInterval(); // timeout for loading gif

      this.textInput.clear(); // clear postcode in case dropdown item is selected instead

      await this.clearPostcode(); //clear inputPostcode from state

      console.log(
        this.state.selectedItem + " <-- this is the administrative area code"
      );
    } else if (this.state.postState !== prevState.postState) {
      this.setState({ buttonPressed: false }); // set button pressed to false after state is changed

      await this.getDataEW(); // get England and Wales deaths dataset - was causing unhandled promise rejection in componentDidMount

      await this.setTotalDeathsEW(); // set total deaths for England and Wales dataset - was causing unhandled promise rejection in componentDidMount

      await this.getAdminDist(); // get admin dist name of postcode

      if (
        this.state.postError === true &&
        this.state.connection_status === true &&
        this.state.connection_reachable === true
      ) {
        //Alert if postcode is invalid (and device is connected)
        Alert.alert(
          "OOPS!",
          "Something went wrong.\n\nYou either didn't type anything, made a mistake, or used a postcode from a country other than the UK.\n\nPlease try again!"
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
        await this.getData(); // get the data with the relevant place of death

        if (
          this.state.postError === true &&
          this.state.connection_status === true &&
          this.state.connection_reachable === true
        ) {
          //Alert if postcode is out of bounds (and device is connected)
          Alert.alert(
            "OOPS!",
            "Something went wrong.\n\nThe postcode you entered is a valid UK postcode, but it's not within England or Wales.\n\nPlease try again with a different postcode, or use the dropdown menu for a guaranteed result!"
          );
          this.textInput.clear(); //clear postcode from TextInput
          this.clearPostcode(); //clear postcode from state
        } else {
          await this.setTotalDeaths(); // update the totalDeaths

          // repeat for home
          await this.setHome();
          await this.getData();
          await this.setTotalDeaths();

          // repeat for hospice
          await this.setHospice();
          await this.getData();
          await this.setTotalDeaths();

          // repeat for elsewhere
          await this.setElsewhere();
          await this.getData();
          await this.setTotalDeaths();

          // repeat for other
          await this.setOther();
          await this.getData();
          await this.setTotalDeaths();

          // repeat for care home
          await this.setCareHome();
          await this.getData();
          await this.setTotalDeaths();

          // set death rates
          await this.setDeathRate();
          await this.setDeathRateEW();

          await this.setDeadlihood(); //set deadlihood

          await this._setInterval(); // timeout for loading gif

          this.textInput.clear(); //clear postcode after being submitted

          await this.clearPostcode(); //clear inputPostcode from state

          console.log(
            this.state.selectedItem +
              " <-- this is the administrative area code"
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
          <TouchableHighlight
            onPress={() => {
              this.setState({ buttonPressed: true });
            }}
            activeOpacity={1}
            style={this.state.pressStatus ? styles.imagePress : styles.image}
            onHideUnderlay={this._onHideUnderlay.bind(this)}
            onShowUnderlay={this._onShowUnderlay.bind(this)}
          >
            <Image
              style={this.state.pressStatus ? styles.imagePress : styles.image}
              source={require("./assets/top_icon.png")}
            />
          </TouchableHighlight>

          <Text style={styles.titleText}>
            Select an area below
            <Tooltip
              height={140}
              width={250}
              backgroundColor="#a446de"
              skipAndroidStatusBar={true}
              popover={
                <Text style={styles.toolText}>
                  Search by administrative area of England and Wales only - e.g.
                  your council or borough.{"\n"}Tap return on your keyboard to
                  close the dropdown menu.
                </Text>
              }
            >
              <Image
                style={{ width: 20, height: 20, marginLeft: 4 }}
                source={require("./assets/info_circle.png")}
              />
            </Tooltip>
          </Text>

          <SearchableDropdown
            onItemSelect={(item) => {
              this.setState({
                loading: true,
                selectedItem: item["id"],
                selectedCity: item["name"],
                postError: false,
              });
              this.dropStateUpdate(); //run function that adds to counter each time item is selected, to update state correctly
            }}
            containerStyle={{ padding: 5, maxWidth: "80%" }}
            itemStyle={{
              padding: 10,
              marginTop: 3,
              backgroundColor: "#a446de",
              borderColor: "#10c62d",
              borderWidth: 3,
              borderRadius: 10,
              minWidth: "75%",
            }}
            itemTextStyle={{
              color: "#222",
              fontSize: 16,
              fontWeight: "bold",
            }}
            itemsContainerStyle={{ maxWidth: "100%" }}
            items={Array} //input array here
            resetValue={false}
            textInputProps={{
              placeholder: "search for a location",
              underlineColorAndroid: "transparent",
              placeholderTextColor: "#4fff6b",
              color: "#10c62d",
              fontSize: 16,
              textShadowColor: "black",
              textShadowRadius: 10,
              fontWeight: "bold",

              style: {
                padding: 12,
                borderWidth: 3,
                borderColor: "#10c62d",
                borderRadius: 10,
                minWidth: "100%",
                maxWidth: "100%",
                backgroundColor: "#a446de",
                marginTop: 1,
              },
            }}
            listProps={{
              nestedScrollEnabled: true,
              keyboardDismissMode: "on-drag",
            }}
          />

          <Text style={styles.subText}>
            or input a postcode
            <Tooltip
              height={80}
              width={255}
              backgroundColor={"#a446de"}
              skipAndroidStatusBar={true}
              popover={
                <Text style={styles.toolText}>
                  Please input a full postcode for either England or Wales only.
                </Text>
              }
            >
              <Image
                style={{ width: 20, height: 20, marginLeft: 4 }}
                source={require("./assets/info_circle.png")}
              />
            </Tooltip>
          </Text>
          <TextInput
            style={styles.input}
            ref={(input) => {
              this.textInput = input;
            }}
            onSubmitEditing={(postcode) => {
              let str = postcode.nativeEvent.text;
              str = str.replace(/\s+/g, "").toUpperCase(); //remove whitespace and convert to uppercase (for correct API use)
              this.setState({ inputPostcode: str, loading: true });
              this.postStateUpdate(); //call counter function to update state each time postcode is input, even if it's the same one
            }}
            placeholder="input full postcode"
            placeholderTextColor="#4fff6b"
            underlineColorAndroid="transparent"
            color="#10c62d"
            autoCompleteType="postal-code"
          />
          {this.state.buttonPressed == true
            ? null
            : !this.state.loading && <PostLoader {...this.state} />}

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
  titleText: {
    fontSize: 20,
    textAlign: "center",
    fontWeight: "bold",
    color: "#10c62d",
    marginBottom: 5,
    paddingTop: 25,
    textShadowColor: "black",
    textShadowRadius: 10,
  },
  subText: {
    fontSize: 20,
    textAlign: "center",
    fontWeight: "bold",
    color: "#10c62d",
    marginBottom: 5,
    paddingTop: 5,
    textShadowColor: "black",
    textShadowRadius: 10,
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
    height: 55,
    margin: 12,
    borderWidth: 1,
    padding: 12,
    borderWidth: 3,
    borderColor: "#10c62d",
    borderRadius: 10,
    maxWidth: "80%",
    maxHeight: "100%",
    backgroundColor: "#a446de",
    marginTop: 5,
    fontSize: 16,
    marginBottom: 10,
    textShadowColor: "black",
    textShadowRadius: 10,
    fontWeight: "bold",
  },
  toolText: {
    color: "#4fff6b",
    fontSize: 14,
    fontWeight: "bold",
    padding: 10,
    textShadowColor: "black",
    textShadowRadius: 10,
  },
});
