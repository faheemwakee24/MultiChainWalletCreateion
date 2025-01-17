// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import CreateWallet from './src/Screens/Wallet/CreateWallet';
import ImportWallet from './src/Screens/Wallet/ImportWallet';
import WalletDashboard from './src/Screens/Wallet/WalletDashboard';
import SendFundsScreen from './src/Screens/Wallet/SendToken';
import ConnectMYWallet from './src/Screens/Wallet/ConnectWallet/ConnectMyWallet';
import BrowserHome from './src/Screens/Browser/BrowserHome';


const Stack = createStackNavigator(); // Create Stack Navigator

const AppStack = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="CreateWallet" >
        <Stack.Screen name="CreateWallet" component={CreateWallet} />
        <Stack.Screen name="ImportWallet" component={ImportWallet} />
        <Stack.Screen name="WalletDashboard" component={WalletDashboard}   options={{ headerShown: false }}   />
        <Stack.Screen name="SendFundsScreen" component={SendFundsScreen} />

        <Stack.Screen name="ConnectMYWallet" component={ConnectMYWallet} />
        <Stack.Screen name="BrowserHome" component={BrowserHome} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppStack;
