import React from "react";
import { TouchableOpacity } from "react-native";
import { createStackNavigator } from "react-navigation";
import Ionicons from "react-native-vector-icons/Ionicons";

import NewUser from "../modals/NewUser";
import TabNavigator from "./TabNavigator";

const MainStack = createStackNavigator(
  {
    Home: TabNavigator
  },
  {
    initialRouteName: "Home",
    navigationOptions: ({ navigation }) => ({
      headerStyle: {
        backgroundColor: "#0268f4"
      },
      headerRight: (
        <TouchableOpacity
          style={{ marginRight: 10 }}
          onPress={() => navigation.navigate("NewUserModal")}
        >
          <Ionicons name="ios-add" size={40} color="#fff" />
        </TouchableOpacity>
      ),
      // headerTintColor: "#fff",
      title: "JS-DATA Demo"
    })
  }
);

export default createStackNavigator(
  {
    Main: MainStack,
    NewUserModal: NewUser
  },
  {
    headerMode: "none",
    initialRouteName: "Main",
    mode: "modal"
  }
);
