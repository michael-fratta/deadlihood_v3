import React, { Component } from "react";
import {
  StyleSheet,
  Text,
  ScrollView,
  Modal,
  Pressable,
  View,
  Image,
} from "react-native";
import Unorderedlist from "react-native-unordered-list";
import * as WebBrowser from "expo-web-browser";
import Dictionary from "./geoPop_dict.js";

export default class PostLoader extends Component {
  constructor() {
    super();
    this.state = {
      modalVisible: false,
    };
  }

  setModalVisible = (visible) => {
    this.setState({ modalVisible: visible });
  };

  openDeathsLink = () => {
    WebBrowser.openBrowserAsync(
      "https://www.ons.gov.uk/peoplepopulationandcommunity/healthandsocialcare/causesofdeath/datasets/deathregistrationsandoccurrencesbylocalauthorityandhealthboard"
    );
  };

  openPopLink = () => {
    WebBrowser.openBrowserAsync(
      "https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/populationestimatesforukenglandandwalesscotlandandnorthernireland"
    );
  };

  render() {
    const { modalVisible } = this.state;

    if (
      this.props.selectedItem !== "" &&
      this.props.postError === false &&
      this.props.connection_status === true &&
      this.props.connection_reachable === true &&
      this.props.stringlihood !== "" &&
      this.props.selectedItem != undefined
    ) {
      //only run below code if selectedItem and stringlihood is not blank and postcode is correct and phone has working connection

      return (
        <ScrollView contentContainerstyle={styles.contentContainer}>
          <View style={styles.contentContainer}>
            <Text style={styles.titleText}>~ {this.props.selectedCity} ~</Text>
            <Text style={styles.baseText}>
              was
              <Text style={styles.resultText}>
                {" "}
                {this.props.stringlihood} deadly{" "}
              </Text>
              than England and Wales, as of 9 Jan 2024*
            </Text>

            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => {
                this.setModalVisible(!modalVisible);
              }}
            >
              <View style={styles.modalView}>
                <ScrollView contentContainerstyle={styles.contentContainer}>
                  <Text style={styles.breakText}>
                    The breakdown for {this.props.selectedCity}, and for England
                    & Wales - for the last week of 2023 - is as follows below ⤵
                  </Text>
                  <Unorderedlist
                    bulletUnicode={0x2023}
                    color="#10c62d"
                    style={styles.bulletText}
                  >
                    <Text style={styles.bulletText}>
                      {this.props.selectedCity} - total deaths:
                      <Text style={styles.baseText}>
                        {" "}
                        {this.props.totalDeaths}
                      </Text>
                    </Text>
                  </Unorderedlist>
                  <Unorderedlist
                    bulletUnicode={0x2023}
                    color="#10c62d"
                    style={styles.bulletText}
                  >
                    <Text style={styles.bulletText}>
                      {this.props.selectedCity} - total population:
                      <Text style={styles.baseText}>
                        {" "}
                        {Dictionary[this.props.selectedItem]
                          .toString()
                          .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{" "}
                      </Text>
                    </Text>
                  </Unorderedlist>
                  <Unorderedlist
                    bulletUnicode={0x2023}
                    color="#10c62d"
                    style={styles.bulletText}
                  >
                    <Text style={styles.bulletText}>
                      England & Wales - total deaths:
                      <Text style={styles.baseText}>
                        {" "}
                        {this.props.stringDeathsEW}
                      </Text>
                    </Text>
                  </Unorderedlist>
                  <Unorderedlist
                    bulletUnicode={0x2023}
                    color="#10c62d"
                    style={styles.bulletText}
                  >
                    <Text style={styles.bulletText}>
                      England & Wales - total population:
                      <Text style={styles.baseText}> 59,719,724 </Text>
                    </Text>
                  </Unorderedlist>
                  <Unorderedlist
                    bulletUnicode={0x2023}
                    color="#10c62d"
                    style={styles.bulletText}
                  >
                    <Text style={styles.bulletText}>
                      {this.props.selectedCity} - mortality rate (per 10,000
                      people):
                      <Text style={styles.baseText}>
                        {" "}
                        {this.props.deathRate}
                      </Text>
                    </Text>
                  </Unorderedlist>
                  <Unorderedlist
                    bulletUnicode={0x2023}
                    color="#10c62d"
                    style={styles.bulletText}
                  >
                    <Text style={styles.bulletText}>
                      England & Wales - mortality rate (per 10,000 people):
                      <Text style={styles.baseText}>
                        {" "}
                        {this.props.deathRateEW}
                      </Text>
                    </Text>
                  </Unorderedlist>
                  <Text style={styles.explainText}>
                    The Deadlihood for {this.props.selectedCity} was calculated
                    by taking its weekly deaths count from the Office for
                    National Statistics' (ONS){" "}
                    <Text style={styles.linkText} onPress={this.openDeathsLink}>
                      database
                    </Text>{" "}
                    , and dividing it by the weekly deaths count for England and
                    Wales as a whole (from the same database).
                  </Text>
                  <Text style={styles.explainText}>
                    First, a mortality rate is calculated for both{" "}
                    {this.props.selectedCity} and England & Wales as a whole -
                    by dividing the respective weekly deaths count by the total
                    respective populations (also taken from the{" "}
                    <Text style={styles.linkText} onPress={this.openPopLink}>
                      ONS
                    </Text>{" "}
                    ) . Then, the mortality rate of {this.props.selectedCity} is
                    compared to that of England and Wales as a whole - to come
                    up with a percentage (i.e. the Deadlihood).
                  </Text>
                  <Text style={styles.explainText}>
                    The mortality rate is calculated per 10,000 people - to give
                    a significant number, and to 'level the playing field' in
                    terms of statistics. An area with a higher population would
                    be expected to have more deaths than one with a lower
                    population (though this is not a given). Therefore - what
                    this gives us is a picture of how many deaths there were for
                    every 10,000 people in that area. In other words - the
                    mortality rate for {this.props.selectedCity} can be read as{" "}
                    {this.props.deathRate} people having died out of every
                    10,000 people in that location.
                  </Text>
                  <Text style={styles.questionText}>
                    🤔 Why England & Wales as a whole (and not also N. Ireland
                    and/or Scotland) ? Simply because the ONS only provides
                    weekly data for England and Wales - Scotland and N. Ireland
                    have their own data collection services (which aren't freely
                    accessible). To provide the largest possible picture - the
                    entirety of the available ONS dataset was used (i.e. England
                    and Wales).
                  </Text>
                </ScrollView>

                <Pressable
                  style={styles.buttonClose}
                  onPress={() => this.setModalVisible(!modalVisible)}
                >
                  <Text style={styles.xStyle}>✖</Text>
                </Pressable>
              </View>
            </Modal>

            <Pressable
              style={styles.button}
              onPress={() => this.setModalVisible(true)}
            >
              <Text style={styles.whyText}>Why?</Text>
            </Pressable>

            <Text style={styles.quoteText}>
              *The ONS has stopped updating the datasets as of 2024.
            </Text>
            <Text style={styles.sourceText}>
              Source ➡ Office for National Statistics (www.ons.gov.uk)
            </Text>
            <Text style={styles.clearText}>
              Press the
              <Image
                style={{ width: 30, height: 30 }}
                source={require("./skull_icon_no_background.png")}
              />
              to clear this section.
            </Text>
          </View>
        </ScrollView>
      );
    } else if (
      this.props.connection_status === false ||
      this.props.connection_reachable === false
    ) {
      // if device is not connected
      return (
        <Text style={styles.breakText}>Your device is not connected!</Text>
      );
    } else if (
      this.props.connection_status === true &&
      this.props.postError === true &&
      this.props.connection_reachable === true
    ) {
      return <Text style={styles.breakText}>Try again!</Text>;
    } else {
      return null;
    }
  }
}

const styles = StyleSheet.create({
  contentContainer: {
    borderWidth: 3,
    borderColor: "#10c62d",
    borderRadius: 10,
    maxWidth: "100%",
    backgroundColor: "#a446de",
    marginHorizontal: 25,
    marginTop: 20,
    flex: 1,
    margin: 20,
  },
  baseText: {
    padding: 5,
    fontSize: 20,
    textAlign: "center",
    fontWeight: "bold",
    color: "#10c62d",
    marginHorizontal: 7,
    textShadowColor: "black",
    textShadowRadius: 10,
  },
  resultText: {
    fontSize: 20,
    textAlign: "center",
    fontWeight: "bold",
    color: "black",
    textShadowColor: "grey",
    textShadowRadius: 5,
  },
  breakText: {
    padding: 5,
    fontSize: 20,
    textAlign: "center",
    fontWeight: "bold",
    color: "#10c62d",
    textShadowColor: "black",
    textShadowRadius: 10,
  },
  bulletText: {
    fontSize: 20,
    textAlign: "left",
    fontWeight: "bold",
    color: "black",
    textShadowColor: "grey",
    textShadowRadius: 5,
    marginTop: 5,
  },
  explainText: {
    fontSize: 18,
    textAlign: "justify",
    fontWeight: "bold",
    color: "black",
    textShadowColor: "grey",
    textShadowRadius: 5,
    marginTop: 10,
  },
  linkText: {
    fontSize: 18,
    textAlign: "justify",
    color: "grey",
    textDecorationLine: "underline",
    textShadowColor: "black",
    textShadowRadius: 10,
  },
  titleText: {
    padding: 5,
    fontSize: 30,
    textAlign: "center",
    fontWeight: "bold",
    color: "#10c62d",
    textShadowColor: "black",
    textShadowRadius: 10,
  },
  whyText: {
    fontSize: 25,
    textAlign: "center",
    fontWeight: "bold",
    color: "black",
    textShadowColor: "grey",
    textShadowRadius: 10,
  },
  quoteText: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "normal",
    color: "#10c62d",
    fontStyle: "italic",
    marginLeft: 20,
    marginRight: 20,
    fontWeight: "bold",
    textShadowColor: "black",
    textShadowRadius: 10,
    marginTop: 10,
  },
  sourceText: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "normal",
    color: "black",
    fontStyle: "italic",
    marginTop: 10,
    fontWeight: "bold",
    textShadowColor: "grey",
    textShadowRadius: 10,
    padding: 5,
  },
  clearText: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "normal",
    color: "black",
    fontStyle: "italic",
    fontWeight: "bold",
    textShadowColor: "grey",
    textShadowRadius: 10,
    marginBottom: 10,
  },
  questionText: {
    fontSize: 14,
    textAlign: "justify",
    fontWeight: "normal",
    color: "#10c62d",
    fontWeight: "bold",
    textShadowColor: "black",
    textShadowRadius: 10,
    marginBottom: 10,
    marginTop: 10,
  },

  modalView: {
    margin: 20,
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "black",
    shadowRadius: 10,
    borderWidth: 3,
    borderColor: "#10c62d",
    backgroundColor: "#a446de",
    marginTop: 165,
    flex: 1,
  },
  button: {
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    width: 150,
    alignSelf: "center",
    borderWidth: 3,
    borderColor: "#10c62d",
    backgroundColor: "#8137af",
  },
  buttonClose: {
    width: 50,
    borderRadius: 10,
    marginTop: 35,
    backgroundColor: "#10c62d",
  },
  xStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 20,
    marginBottom: 4,
    alignSelf: "stretch",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
  },
});
