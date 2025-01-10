import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import {ethers} from 'ethers';
import { getProvider } from '../../Web3Helpers/Provider';
import AsyncStorage from '@react-native-async-storage/async-storage';
const ImportWallet = () => {
  const [mnemonicOrPrivateKey, setMnemonicOrPrivateKey] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const saveToAsyncStorage = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
      console.log(`Saved ${key} to AsyncStorage`);
    } catch (error) {
      console.error(`Failed to save ${key}`, error);
    }
  };
  const importWallet = async () => {
    const isValidPrivateKey = privateKey => {
        console.log('abccc',privateKey)
     return true;
        try {
        if (/^[0-9a-fA-F]{64}$/.test(privateKey)) {
          new ethers.Wallet(privateKey);
          return true;
        }
        return false;
      } catch (error) {
        return false;
      }
    };
  
    try {
      setIsLoading(true);
      let wallet;
  
      // Validate input as mnemonic or private key
      if (ethers.Mnemonic.isValidMnemonic(mnemonicOrPrivateKey)) {
        wallet = ethers.HDNodeWallet.fromPhrase(mnemonicOrPrivateKey);
      } else if (isValidPrivateKey(mnemonicOrPrivateKey)) {
        wallet = new ethers.Wallet(mnemonicOrPrivateKey);
      } else {
        Alert.alert(
          'Invalid Input',
          'Please provide a valid mnemonic phrase or private key.',
        );
        return;
      }
  
      // Set wallet address
      setWalletAddress(wallet.address);
  
  console.log('wallet',wallet)    // Attach provider
      const provider = getProvider();
      wallet = wallet.connect(provider);
  
      // Check network connection
      const network = await provider.getNetwork();
      await saveToAsyncStorage('walletAddress', wallet.address);
      await saveToAsyncStorage('privateKey', wallet.privateKey);
      console.log('Connected to network:', network);
      if (network) {
        Alert.alert(
          'Connected to Network',
          `Network Name: ${network.name}\nChain ID: ${network.chainId}`,
        );
      } else {
        throw new Error('Failed to connect to the network.');
      }
  
      // Fetch wallet balance
      const balance = await provider.getBalance(wallet.address);
      const formattedBalance = ethers.formatEther(balance);
      setWalletBalance(formattedBalance);
  
      Alert.alert(
        'Wallet Imported',
        `Wallet Address: ${wallet.address}\nBalance: ${formattedBalance} ETH`,
      );
    } catch (error) {
      console.log('Error:', error.message);
      Alert.alert('Error', error.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Import Wallet</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Mnemonic Phrase or Private Key"
        value={mnemonicOrPrivateKey}
        onChangeText={setMnemonicOrPrivateKey}
        multiline
        numberOfLines={4}
      />
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonLoading]}
        onPress={importWallet}
        disabled={isLoading}>
        <Text style={styles.buttonText}>
          {isLoading ? 'Importing...' : 'Import Wallet'}
        </Text>
      </TouchableOpacity>
      {walletAddress ? (
        <View style={styles.walletInfo}>
          <Text style={styles.label}>Wallet Address:</Text>
          <Text style={styles.value}>{walletAddress}</Text>
          <Text style={styles.label}>Wallet Balance:</Text>
          <Text style={styles.value}>{walletBalance} ETH</Text>
        </View>
      ) : null}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    backgroundColor: '#FFF',
  },
  button: {
    backgroundColor: '#3498DB',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonLoading: {
    backgroundColor: '#A9CCE3',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  walletInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCC',
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  value: {
    fontSize: 14,
    marginBottom: 15,
  },
});
export default ImportWallet;