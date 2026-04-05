import React from "react";
import { Image, TouchableHighlight } from "react-native";

export default function TopIconButton({
  onHideUnderlay,
  onPress,
  onShowUnderlay,
  pressed,
  styles,
}) {
  return (
    <TouchableHighlight
      activeOpacity={1}
      onHideUnderlay={onHideUnderlay}
      onPress={onPress}
      onShowUnderlay={onShowUnderlay}
      style={[pressed ? styles.imagePress : styles.image, styles.topIconButton]}
    >
      <Image
        source={require("../../../assets/top_icon.png")}
        style={pressed ? styles.imagePress : styles.image}
      />
    </TouchableHighlight>
  );
}
