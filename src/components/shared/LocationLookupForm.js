import React from "react";
import { Text, TextInput, View } from "react-native";
import { Dropdown } from "react-native-element-dropdown";

export default function LocationLookupForm({
  data,
  onDropdownChange,
  onPostcodeSubmit,
  renderDropdownItem,
  selectedItem,
  styles,
  textInputRef,
}) {
  return (
    <View style={styles.formContent}>
      <Text style={styles.titleText}>
        Select an administrative area of England or Wales below
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
        placeholder="select a location"
        placeholderStyle={styles.placeholderStyle}
        renderItem={renderDropdownItem}
        search
        searchPlaceholder="search..."
        selectedTextStyle={styles.selectedTextStyle}
        style={styles.dropdown}
        value={selectedItem}
        valueField="value"
      />

      <Text style={styles.titleText}>
        or input an English or Welsh postcode instead
      </Text>

      <TextInput
        autoComplete="postal-code"
        color="#10c62d"
        onSubmitEditing={onPostcodeSubmit}
        placeholder="input full postcode"
        placeholderTextColor="#4fff6b"
        ref={textInputRef}
        style={styles.input}
        underlineColorAndroid="transparent"
      />
    </View>
  );
}
