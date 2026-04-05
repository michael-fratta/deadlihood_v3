import React, { useState } from "react";
import {
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Unorderedlist from "react-native-unordered-list";
import * as WebBrowser from "expo-web-browser";
import {
  ENGLAND_WALES_POPULATION_LABEL,
  URLS,
} from "../../constants/appConfig";
import { COLORS } from "../../constants/theme";
import { locationPopulationById } from "../../data/geoData";

export default function PostLoader({
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
}) {
  const [modalVisible, setModalVisible] = useState(false);

  function openDeathsLink() {
    WebBrowser.openBrowserAsync(URLS.onsDeathsDataset);
  }

  function openPopulationLink() {
    WebBrowser.openBrowserAsync(URLS.onsPopulationDataset);
  }

  if (
    selectedItem &&
    !postError &&
    connectionStatus &&
    connectionReachable &&
    stringlihood
  ) {
    return (
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.contentContainer}>
          <Text style={styles.titleText}>~ {selectedCity} ~</Text>
          <Text style={styles.baseText}>
            was
            <Text style={styles.resultText}> {stringlihood} deadly </Text>
            than England and Wales, as of 9 Jan 2024*
          </Text>

          <Modal
            animationType="slide"
            transparent
            visible={modalVisible}
            onRequestClose={() => {
              setModalVisible(!modalVisible);
            }}
          >
            <View style={styles.modalView}>
              <ScrollView contentContainerStyle={styles.scrollContentContainer}>
                <Text style={styles.breakText}>
                  The breakdown for {selectedCity}, and for England & Wales -
                  for the last week of 2023 - is as follows below ⤵
                </Text>
                <Unorderedlist
                  bulletUnicode={0x2023}
                  color={COLORS.border}
                  style={styles.bulletText}
                >
                  <Text style={styles.bulletText}>
                    {selectedCity} - total deaths:
                    <Text style={styles.baseText}> {totalDeaths}</Text>
                  </Text>
                </Unorderedlist>
                <Unorderedlist
                  bulletUnicode={0x2023}
                  color={COLORS.border}
                  style={styles.bulletText}
                >
                  <Text style={styles.bulletText}>
                    {selectedCity} - total population:
                    <Text style={styles.baseText}>
                      {" "}
                      {locationPopulationById[selectedItem]
                        .toString()
                        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{" "}
                    </Text>
                  </Text>
                </Unorderedlist>
                <Unorderedlist
                  bulletUnicode={0x2023}
                  color={COLORS.border}
                  style={styles.bulletText}
                >
                  <Text style={styles.bulletText}>
                    England & Wales - total deaths:
                    <Text style={styles.baseText}> {stringDeathsEW}</Text>
                  </Text>
                </Unorderedlist>
                <Unorderedlist
                  bulletUnicode={0x2023}
                  color={COLORS.border}
                  style={styles.bulletText}
                >
                  <Text style={styles.bulletText}>
                    England & Wales - total population:
                    <Text style={styles.baseText}>
                      {" "}
                      {ENGLAND_WALES_POPULATION_LABEL}{" "}
                    </Text>
                  </Text>
                </Unorderedlist>
                <Unorderedlist
                  bulletUnicode={0x2023}
                  color={COLORS.border}
                  style={styles.bulletText}
                >
                  <Text style={styles.bulletText}>
                    {selectedCity} - mortality rate (per 10,000 people):
                    <Text style={styles.baseText}> {deathRate}</Text>
                  </Text>
                </Unorderedlist>
                <Unorderedlist
                  bulletUnicode={0x2023}
                  color={COLORS.border}
                  style={styles.bulletText}
                >
                  <Text style={styles.bulletText}>
                    England & Wales - mortality rate (per 10,000 people):
                    <Text style={styles.baseText}> {deathRateEW}</Text>
                  </Text>
                </Unorderedlist>
                <Text style={styles.explainText}>
                  The Deadlihood for {selectedCity} was calculated by taking its
                  weekly deaths count from the Office for National Statistics'
                  (ONS){" "}
                  <Text style={styles.linkText} onPress={openDeathsLink}>
                    database
                  </Text>{" "}
                  , and dividing it by the weekly deaths count for England and
                  Wales as a whole (from the same database).
                </Text>
                <Text style={styles.explainText}>
                  First, a mortality rate is calculated for both {selectedCity}
                  and England & Wales as a whole - by dividing the respective
                  weekly deaths count by the total respective populations (also
                  taken from the{" "}
                  <Text style={styles.linkText} onPress={openPopulationLink}>
                    ONS
                  </Text>{" "}
                  ) . Then, the mortality rate of {selectedCity} is compared to
                  that of England and Wales as a whole - to come up with a
                  percentage (i.e. the Deadlihood).
                </Text>
                <Text style={styles.explainText}>
                  The mortality rate is calculated per 10,000 people - to give a
                  significant number, and to 'level the playing field' in terms
                  of statistics. An area with a higher population would be
                  expected to have more deaths than one with a lower population
                  (though this is not a given). Therefore - what this gives us
                  is a picture of how many deaths there were for every 10,000
                  people in that area. In other words - the mortality rate for{" "}
                  {selectedCity} can be read as {deathRate} people having died
                  out of every 10,000 people in that location.
                </Text>
                <Text style={styles.questionText}>
                  🤔 Why England & Wales as a whole (and not also N. Ireland
                  and/or Scotland) ? Simply because the ONS only provides weekly
                  data for England and Wales - Scotland and N. Ireland have
                  their own data collection services (which aren't freely
                  accessible). To provide the largest possible picture - the
                  entirety of the available ONS dataset was used (i.e. England
                  and Wales).
                </Text>
              </ScrollView>

              <Pressable
                style={styles.buttonClose}
                onPress={() => setModalVisible(!modalVisible)}
              >
                <Text style={styles.xStyle}>✖</Text>
              </Pressable>
            </View>
          </Modal>

          <Pressable
            style={styles.button}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.whyText}>More info</Text>
          </Pressable>

          <Text style={styles.quoteText}>
            *The ONS has stopped updating the datasets as of 2024.
          </Text>
          <Text style={styles.sourceText}>
            Source ➡ Office for National Statistics (
            <Text
              style={styles.externalLinkText}
              onPress={() => Linking.openURL(URLS.onsHome)}
            >
              www.ons.gov.uk
            </Text>
            ) NB: This app is not affiliated with the ONS. It is only using
            freely available data (via the freely available API). Any and all
            interpretations of this data are limited to the scope of this app.
          </Text>
          <Text style={styles.clearText}>
            Press the
            <Image
              source={require("../../../assets/skull_icon_no_background.png")}
              style={styles.inlineImage}
            />
            to clear this section.
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (!connectionStatus || !connectionReachable) {
    return <Text style={styles.breakText}>Your device is not connected!</Text>;
  }

  if (connectionStatus && postError && connectionReachable) {
    return <Text style={styles.breakText}>Try again!</Text>;
  }

  return null;
}

const styles = StyleSheet.create({
  scrollContentContainer: {
    alignItems: "center",
  },
  contentContainer: {
    borderWidth: 3,
    borderColor: COLORS.border,
    borderRadius: 10,
    maxWidth: "100%",
    backgroundColor: COLORS.card,
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
    color: COLORS.textPrimary,
    marginHorizontal: 7,
    textShadowColor: COLORS.textDark,
    textShadowRadius: 10,
  },
  resultText: {
    fontSize: 20,
    textAlign: "center",
    fontWeight: "bold",
    color: COLORS.textDark,
    textShadowColor: COLORS.textMuted,
    textShadowRadius: 5,
  },
  breakText: {
    padding: 5,
    fontSize: 20,
    textAlign: "center",
    fontWeight: "bold",
    color: COLORS.textPrimary,
    textShadowColor: COLORS.textDark,
    textShadowRadius: 10,
  },
  bulletText: {
    fontSize: 20,
    textAlign: "left",
    fontWeight: "bold",
    color: COLORS.textDark,
    textShadowColor: COLORS.textMuted,
    textShadowRadius: 5,
    marginTop: 5,
  },
  explainText: {
    fontSize: 18,
    textAlign: "justify",
    fontWeight: "bold",
    color: COLORS.textDark,
    textShadowColor: COLORS.textMuted,
    textShadowRadius: 5,
    marginTop: 10,
  },
  linkText: {
    fontSize: 18,
    textAlign: "justify",
    color: COLORS.textMuted,
    textDecorationLine: "underline",
    textShadowColor: COLORS.textDark,
    textShadowRadius: 10,
  },
  titleText: {
    padding: 5,
    fontSize: 30,
    textAlign: "center",
    fontWeight: "bold",
    color: COLORS.textPrimary,
    textShadowColor: COLORS.textDark,
    textShadowRadius: 10,
  },
  whyText: {
    fontSize: 25,
    textAlign: "center",
    fontWeight: "bold",
    color: COLORS.textDark,
    textShadowColor: COLORS.textMuted,
    textShadowRadius: 10,
  },
  quoteText: {
    fontSize: 14,
    textAlign: "center",
    color: COLORS.textPrimary,
    fontStyle: "italic",
    marginLeft: 20,
    marginRight: 20,
    fontWeight: "bold",
    textShadowColor: COLORS.textDark,
    textShadowRadius: 10,
    marginTop: 10,
  },
  sourceText: {
    fontSize: 14,
    textAlign: "center",
    color: COLORS.textDark,
    fontStyle: "italic",
    marginTop: 10,
    fontWeight: "bold",
    textShadowColor: COLORS.textMuted,
    textShadowRadius: 10,
    padding: 20,
  },
  clearText: {
    fontSize: 14,
    textAlign: "center",
    color: COLORS.textDark,
    fontStyle: "italic",
    fontWeight: "bold",
    textShadowColor: COLORS.textMuted,
    textShadowRadius: 10,
    marginBottom: 10,
  },
  questionText: {
    fontSize: 14,
    textAlign: "justify",
    color: COLORS.textPrimary,
    fontWeight: "bold",
    textShadowColor: COLORS.textDark,
    textShadowRadius: 5,
    marginBottom: 10,
    marginTop: 10,
  },

  modalView: {
    margin: 20,
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: COLORS.textDark,
    shadowRadius: 10,
    borderWidth: 3,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
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
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardAccent,
  },
  buttonClose: {
    width: 50,
    borderRadius: 10,
    marginTop: 35,
    backgroundColor: COLORS.border,
  },
  xStyle: {
    color: COLORS.white,
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
  inlineImage: {
    width: 30,
    height: 30,
  },
  externalLinkText: {
    color: COLORS.link,
  },
});
