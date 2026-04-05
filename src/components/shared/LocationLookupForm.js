import React from "react";
import { Text, View } from "react-native";
import { Dropdown } from "react-native-element-dropdown";

export default function LocationLookupForm({
  data,
  onDropdownChange,
  onSearchTextChange,
  renderDropdownItem,
  searchHelperText,
  searchQuery,
  selectedItem,
  styles,
}) {
  return (
    <View style={styles.formContent}>
      <Text style={styles.titleText}>
        Search for an administrative area or enter a full English or Welsh
        postcode below
      </Text>

      <Dropdown
        activeColor="#10c62d"
        containerStyle={styles.dropdownContainer}
        data={data}
        focusedBorderColor="transparent"
        iconStyle={styles.iconStyle}
        inputSearchStyle={styles.inputSearchStyle}
        labelField="label"
        maxHeight={300}
        onChange={onDropdownChange}
        onChangeText={onSearchTextChange}
        placeholder="search area or postcode"
        placeholderStyle={styles.placeholderStyle}
        renderItem={renderDropdownItem}
        searchQuery={searchQuery}
        search
        searchPlaceholder="search area or full postcode..."
        selectedTextStyle={styles.selectedTextStyle}
        style={styles.dropdown}
        value={selectedItem}
        valueField="value"
      />

      <Text style={styles.searchHelperText}>{searchHelperText}</Text>
    </View>
  );
}
