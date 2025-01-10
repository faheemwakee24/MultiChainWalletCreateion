import 'react-native-get-random-values'; // Polyfill for secure random numbers
import '@ethersproject/shims'; // Shims for ethers.js
import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // AsyncStorage
import {ethers} from 'ethers';
import {useNavigation} from '@react-navigation/native';
import {getProvider} from '../../Web3Helpers/Provider';
import {Keypair} from '@solana/web3.js'; // For Solana
import nacl from 'tweetnacl'; // Replacing ed25519-hd-key
import naclUtil from 'tweetnacl-util'; // For encoding/decoding
import * as bip39 from 'bip39'; // For generating and handling mnemonics

const CreateWallet = () => {
  const navigation = useNavigation();
  const [mnemonic, setMnemonic] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [SolPrivateKey, setSolPrivateKey] = useState('');
  const [SolPublicKey, setSolPublicKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const saveToAsyncStorage = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
      console.log(`Saved ${key} to AsyncStorage`);
    } catch (error) {
      console.error(`Failed to save ${key}`, error);
    }
  };

  const createWallet = async () => {
    try {
      setIsLoading(true);
      const provider = getProvider();

      // Generate a random mnemonic (seed phrase)
     // const randomMnemonic = bip39.generateMnemonic();
     const randomMnemonic="change armor reject sure close vessel face absurd report blade random again" 
     console.log('Random Mnemonic:', randomMnemonic);

      // Generate seed from mnemonic
      const seed = await bip39.mnemonicToSeed(randomMnemonic);

      // Derive Solana keypair using the seed and tweetnacl

     // const solanaKeypair =  Keypair.fromSeed(seed.slice(0, 32));
     const solanaKeypair =  Keypair.fromSeed(seed.slice(0, 32));;
     console.log('solana key pair ',solanaKeypair)

      const solanaPublicKey = solanaKeypair.publicKey.toString()
      const solanaPrivateKey = naclUtil.encodeBase64(solanaKeypair.secretKey);
      console.log('Solana public key not encooded =', solanaKeypair.publicKey);
      console.log('Solana private key not encooded =', solanaKeypair.secretKey);
      console.log('Solana Public Key:', solanaPublicKey);
      console.log('Solana Private Key:', solanaPrivateKey);

      setSolPublicKey(solanaPublicKey);
      setSolPrivateKey(solanaPrivateKey);
      setMnemonic(randomMnemonic);

      // Create Ethereum wallet using ethers.js
      const wallet = ethers.Wallet.fromPhrase(randomMnemonic).connect(provider);

      // Set wallet details
      setWalletAddress(wallet.address);
      setPrivateKey(wallet.privateKey);

      // Save wallet details in AsyncStorage
      await saveToAsyncStorage('mnemonic', randomMnemonic);
      await saveToAsyncStorage('walletAddress', wallet.address);
      await saveToAsyncStorage('privateKey', wallet.privateKey);
      await saveToAsyncStorage('SOLwalletAddress', solanaPublicKey);
      await saveToAsyncStorage('SOLprivateKey', solanaPrivateKey);

      Alert.alert(
        'Wallet Created',
        `ETH Address: ${wallet.address} \n SOL Address: ${solanaPublicKey}`,
      );
    } catch (error) {
      console.log('Error creating wallet:', error);
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Ethereum Wallet</Text>
      {isLoading ? (
        <Text>Creating...</Text>
      ) : (
        <>
          <TouchableOpacity
            style={styles.button}
            onPress={createWallet}
            disabled={isLoading}>
            <Text style={styles.buttonText}>
              {isLoading ? 'Creating Wallet...' : 'Create Wallet'}
            </Text>
          </TouchableOpacity>

          {walletAddress ? (
            <>
              <Text style={styles.label}>Mnemonic:</Text>
              <TextInput
                style={styles.input}
                value={mnemonic}
                editable={false}
                multiline
              />
              <Text
                style={{backgroundColor: '#a6f4', fontSize: 30, color: 'red'}}>
                Ethereum Wallet
              </Text>

              <Text style={styles.label}>Eth Wallet Address:</Text>
              <TextInput style={styles.input} value={walletAddress} multiline />

              <Text style={styles.label}>Eth Private Key:</Text>
              <TextInput style={styles.input} value={privateKey} multiline />

              <Text
                style={{backgroundColor: '#a6f4', fontSize: 30, color: 'red'}}>
                Solana Wallet
              </Text>

              <Text style={styles.label}>Sol Wallet Address:</Text>
              <TextInput style={styles.input} value={SolPublicKey} multiline />

              <Text style={styles.label}>Sol Private Key:</Text>
              <TextInput style={styles.input} value={SolPrivateKey} multiline />
            </>
          ) : null}

          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              navigation.navigate('WalletDashboard');
            }}>
            <Text style={styles.buttonText}>Go To Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              navigation.navigate('ImportWallet');
            }}>
            <Text style={styles.buttonText}>Go To Import Wallet</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f4f4f4',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
    fontSize: 14,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateWallet;
