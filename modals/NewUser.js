import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, Input } from "nachos-ui";

import store from "../store";

export default class NewUser extends React.Component {
  state = {
    error: null,
    firstName: null,
    response: null,
    firstName: '',
  };

  handleCreateUser = () => {
    console.log('store.getAll("users")', store.getAll("users"))

    store
      .create("users", { first_name: this.state.firstName })
      .then(response => {
        console.log('store.getAll("users")', store.getAll("users"))
        this.props.navigation.navigate('Main')
      })
      .catch(err => {
        console.log("catch", err);
      });
  };

  render() {
    return (
      <View style={styles.container}>
        <Text style={{ fontSize: 30 }}>Add A New User</Text>

        <View>
          <Input
            placeholder="First Name"
            onChangeText={firstName => this.setState({ firstName })}
            style={{ marginVertical: 15 }}
            value={this.state.firstName}
            width={300}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button onPress={() => this.props.navigation.goBack()} type="danger" style={styles.btn}>
            Cancel
          </Button>

          <Button onPress={this.handleCreateUser}>Save</Button>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  btn: {
    marginRight: 10
  },
  buttonContainer: {
    flexDirection: "row"
  },
  container: {
    alignItems: "center",
    marginTop: 100
  }
});
