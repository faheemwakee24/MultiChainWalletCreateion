import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Button, Platform, StatusBar } from 'react-native';

function SsecondComponent() {
    const navigation=useNavigation()
  return (
    <Button
      title="Show Interstitial"
      onPress={() => {
        navigation.navigate('SecondComponent')
      }}
    />
  );
}
export default SsecondComponent;