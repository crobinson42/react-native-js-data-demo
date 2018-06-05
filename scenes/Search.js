import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, Input } from "nachos-ui";

import store from "../store";

export default class Search extends React.Component {
  state = {
    inputText: "",
    loading: false,
    users: []
  };

  componentDidMount() {
    store.on("add", this.handleStoreChanges);
  }

  componentWillUnmount() {
    store.off("add", this.handleStoreChanges);
  }

  findUsers = () => {
    this.setState({
      loading: true
    });

    store
      .findAll("users", { force: true }) // bypass local cache to hit api for repeat searches
      .then(response => {
        this.setState({
          loading: false
        });
      })
      .catch(err => {
        alert("Errored on Search.js store.findAll()");

        console.log("Errored on Search.js store.findAll()", err);
      });
  };

  getUsersSync = () => {
    //http://www.js-data.io/docs/query-syntax
    return store.filter("users", {
      where: { first_name: { 'likei': this.state.inputText } }
    });
  };

  handleInputChange = inputText => {
    this.findUsers();
    this.setState({ inputText });
  };

  handleStoreChanges = () => {
    if (!this.state.users) return;

    this.setState({
      users: store.getAll("users")
    });
  };

  renderBody = () => {
    if (this.state.loading) {
      return (
        <Text>
          Loading...
        </Text>
      )
    }


    const users = this.getUsersSync();
    console.log('users', users)

    return (
      <Text>
        {users.length && users.map(u => (<View><Text>{u.first_name}</Text></View>)) || "No Users Found..."}
      </Text>
    )
  };

  render() {
    return (
      <View style={styles.container}>
        <View style={{ marginBottom: 10 }}>
          <Input
            placeholder="Search by first name"
            onChangeText={this.handleInputChange}
            style={{ marginVertical: 15 }}
            value={this.state.inputText}
            width={300}
          />

          {this.renderBody()}
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
    // justifyContent: "flex-start"
  }
});
