import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { COLORS } from "../../constants/theme";

export default function PreLoader({ visible }) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.background}>
      <Image
        source={require("../../../assets/shorter_jump.gif")}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    flex: 1,
    resizeMode: "contain",
    width: "50%",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 80,
  },
  background: {
    flex: 1,
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.backgroundAccent,
  },
});
