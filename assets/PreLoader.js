import React, { Component } from "react";
import { StyleSheet, View, Image } from "react-native";

export default class PreLoader extends Component {
  _renderLoader = () => {
    if (this.props.preLoaderVisible)
      return (
        <View style={styles.background}>
          <Image style={styles.image} source={require("./shorter_jump.gif")} />
        </View>
      );
    else return null;
  };
  render() {
    return this._renderLoader();
  }
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
    backgroundColor: "#612886",
  },
});
