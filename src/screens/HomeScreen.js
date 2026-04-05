import React from "react";
import { StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PostLoader from "../components/result/PostLoader";
import PreLoader from "../components/loaders/PreLoader";
import LocationLookupForm from "../components/shared/LocationLookupForm";
import TopIconButton from "../components/shared/TopIconButton";
import { RESULT_OVERLAY_TOP_OFFSET } from "../constants/appConfig";
import { COLORS } from "../constants/theme";
import { useDeadlihoodLookup } from "../hooks/useDeadlihoodLookup";

function renderDropdownItem(item) {
  return (
    <View style={styles.dropdownItem}>
      <Text style={styles.dropdownItemText}>{item.label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const {
    buttonPressed,
    dismissResults,
    handleDropdownChange,
    handleSearchTextChange,
    loading,
    locationOptions,
    onHideUnderlay,
    onShowUnderlay,
    pressStatus,
    results,
    searchHelperText,
    searchQuery,
    selectedItem,
  } = useDeadlihoodLookup();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.background} />

      <View style={styles.container}>
        {!buttonPressed && !loading && (
          <View pointerEvents="auto" style={styles.postLoaderOverlay}>
            <View style={styles.postLoaderCenterer}>
              <PostLoader {...results} />
            </View>
          </View>
        )}

        {!loading && (
          <TopIconButton
            onHideUnderlay={onHideUnderlay}
            onPress={dismissResults}
            onShowUnderlay={onShowUnderlay}
            pressed={pressStatus}
            styles={styles}
          />
        )}

        <LocationLookupForm
          data={locationOptions}
          onDropdownChange={handleDropdownChange}
          onSearchTextChange={handleSearchTextChange}
          renderDropdownItem={renderDropdownItem}
          searchHelperText={searchHelperText}
          searchQuery={searchQuery}
          selectedItem={selectedItem}
          styles={styles}
        />

        <PreLoader visible={loading} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
  },
  formContent: {
    width: "100%",
    alignItems: "center",
  },
  dropdown: {
    padding: 12,
    borderRadius: 10,
    maxWidth: "80%",
    minWidth: "75%",
    backgroundColor: COLORS.card,
    marginTop: 5,
  },
  dropdownContainer: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.card,
  },
  selectedTextStyle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  inputSearchStyle: {
    height: 40,
    width: "auto",
    borderColor: COLORS.white,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    fontSize: 16,
    fontWeight: "bold",
    backgroundColor: COLORS.background,
    textShadowColor: COLORS.textDark,
    textShadowRadius: 5,
  },
  placeholderStyle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  iconStyle: {
    width: 20,
    height: 20,
    tintColor: COLORS.textPrimary,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    textShadowColor: COLORS.textDark,
    textShadowRadius: 5,
  },
  titleText: {
    fontSize: 20,
    textAlign: "center",
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 5,
    paddingTop: 25,
    textShadowColor: COLORS.textDark,
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
  topIconButton: {
    zIndex: 2,
    position: "relative",
  },
  searchHelperText: {
    marginTop: 12,
    maxWidth: "75%",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    textShadowColor: COLORS.textDark,
    textShadowRadius: 4,
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
    backgroundColor: COLORS.background,
  },
  postLoaderCenterer: {
    marginTop: RESULT_OVERLAY_TOP_OFFSET,
    alignItems: "center",
    width: "100%",
  },
});
