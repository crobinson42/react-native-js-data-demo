import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "nachos-ui";

import store from "../store";

export default class GetUsers extends React.Component {
  state = {
    error: null,
    fetchedRemote: false,
    users: store.getAll('users'),
  };

  componentDidMount() {
    store.on("add", this.handleStoreChanges);
  }

  componentWillUnmount() {
    store.off("add", this.handleStoreChanges);
  }

  loadUsers = () => {
    store
      .findAll("users")
      .then(response => {
        console.log('response', response)
        this.setState({
          fetchedRemote: true,
        });

      })
      .catch(err => {
        console.log("catch", err);
      });
  };

  handleStoreChanges = () => {
    if (!this.state.users) return

    this.setState({
      users: store.getAll("users")
    });
  };

  render() {
    const users = this.state.users && this.state.users.map(user => user.first_name)

    return (
      <View style={styles.container}>

        <View style={{ marginBottom: 100 }}>
          {!this.state.fetchedRemote && (
            <Button onPressOut={this.loadUsers} style={{ marginTop: 100 }}>
              Load Users
            </Button>
          )}

          <Text>
            {(this.state.users &&
              JSON.stringify(users, null, 2)) ||
              ""}
          </Text>

          <Text style={{ color: "red" }}>
            {(this.state.error && JSON.stringify(this.state.error, null, 2)) ||
              ""}
          </Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    flexDirection: "column",
    height: "100%",
    justifyContent: "space-between"
  }
});
