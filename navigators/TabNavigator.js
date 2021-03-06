import React from 'react'
import { Button, View, Text } from 'react-native'
import { createBottomTabNavigator } from 'react-navigation';
import Ionicons from 'react-native-vector-icons/Ionicons'

import GetUsers from '../scenes/GetUsers'
import Search from '../scenes/Search'

export default createBottomTabNavigator({
  Users: GetUsers,
  Search: Search,
},
  {
    initialRouteName: 'Users',
    navigationOptions: ({ navigation }) => ({
      tabBarIcon: ({ focused, tintColor }) => {
        const { routeName } = navigation.state;
        let iconName;
        if (routeName === 'Users') {
          iconName = `ios-contact${focused ? '' : '-outline'}`;
        } else if (routeName === 'Search') {
          iconName = `ios-search${focused ? '' : '-outline'}`;
        }

        // You can return any component that you like here! We usually use an
        // icon component from react-native-vector-icons
        return <Ionicons name={iconName} size={25} color={tintColor} />;
      },
    }),
    tabBarOptions: {
      activeTintColor: '#0268f4',
      inactiveTintColor: 'gray',
    },
  });
