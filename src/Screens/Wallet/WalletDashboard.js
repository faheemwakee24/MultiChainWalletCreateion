import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert,Modal, Pressable  ,Linking, ScrollView } from 'react-native';
import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProvider } from '../../Web3Helpers/Provider';
import { useNavigation } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import CloseCircle from '../../Assests/Svgs/CloseCircle.svg'
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import "react-native-blob-util"; // Polyfill for fetch


const WalletDashboard = () => {
  const navigation=useNavigation()
  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState('');
  const [providerName, setProviderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  
  const [modalVisible, setModalVisible] = useState(false);
  const data = 'Hello, this is the data to encode in the QR code!'; // Your QR code data
  const getSolanaBalance = async () => {
    try {
      const connection = new Connection("https://api.devnet.solana.com"); // Connect to Devnet
      const wallet = new PublicKey("nicktrLHhYzLmoVbuZQzHUTicd2sfP571orwo9jfc8c"); // Wallet address
      const balance = await connection.getBalance(wallet); // Get balance in lamports
      console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    } catch (error) {
      console.log("Error getting balance", error);
    }
  };
  const toggleModal = () => {
    setModalVisible(!modalVisible);
  };
  const fetchPrivateKey = async () => {
    try {
      const privateKey = await AsyncStorage.getItem('privateKey');
      if (!privateKey) {
        Alert.alert('Error', 'No private key found in storage');
        return null;
      }
      return privateKey;
    } catch (error) {
      console.error('Error fetching private key:', error.message);
      Alert.alert('Error', 'Failed to fetch private key');
      return null;
    }
  };

  const fetchWalletDetails = async () => {
    try {
      setIsLoading(true);

      // Fetch private key from AsyncStorage
      const privateKey = await fetchPrivateKey();
      if (!privateKey) return;
 
      // Initialize the provider
      const provider = getProvider()
      const network = await provider.getNetwork();
console.log('provider',network)
      // Get provider name
      setProviderName(network.name || 'Unknown Provider');

      // Create a wallet instance
      const wallet = new ethers.Wallet(privateKey, provider);
      setWalletAddress(wallet.address);

      // Fetch balance
      const balance = await provider.getBalance(wallet.address);
      const formattedBalance = ethers.formatEther(balance);
      setWalletBalance(formattedBalance);
    } catch (error) {
      console.error('Error fetching wallet details:', error.message);
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const sendFunds = () => {
   navigation.navigate('SendFundsScreen')
  };

  const receiveFunds = () => {
    Alert.alert('Receive Funds', `Wallet Address:\n${walletAddress}`);
  };

  useEffect(() => {
    // Fetch wallet details on component mount
    fetchWalletDetails();
  }, []);

  console.log('walletAddress',walletAddress)

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Wallet Dashboard</Text>

      {walletAddress ? (
        <View style={styles.infoCard}>
          <Text style={styles.label}>Wallet Address:</Text>
          <Text style={styles.value}>{walletAddress}</Text>

          <Text style={styles.label}>Wallet Balance:</Text>
          <Text style={styles.value}>{walletBalance} ETH</Text>

          <Text style={styles.label}>Provider Name:</Text>
          <Text style={styles.value}>{providerName}</Text>
        </View>
      ) : (
        <Text style={styles.loadingText}>
          {isLoading ? 'Loading...' : 'No Wallet Connected'}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonLoading]}
        onPress={fetchWalletDetails}
        disabled={isLoading}>
        <Text style={styles.buttonText}>
          {isLoading ? 'Fetching...' : 'Refetch Balance'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={sendFunds}>
        <Text style={styles.buttonText}>Send</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={toggleModal}>
        <Text style={styles.buttonText}>Receive</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('ConnectWallet')}>
        <Text style={styles.buttonText}>Connect Wallet</Text> 
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('ConnectMYWallet')}>
        <Text style={styles.buttonText}>Scan To conect Wallet</Text> 
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('BrowserHome')}>
        <Text style={styles.buttonText}>Browser</Text> 
      </TouchableOpacity>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={toggleModal}
        onTouchCancel={toggleModal}
        
      >
        <Pressable onPress={toggleModal} style={styles.overlay}>
          <Pressable style={styles.qrModal}>

            <Text style={styles.qrTitle}>QR Code</Text>
            
            <QRCode
              value={walletAddress} // Data to encode
              size={200} // Size of the QR code
              color="black" // Color of the QR code
              backgroundColor="white" // Background color
              
            />
           
          </Pressable>
        </Pressable>
      </Modal>
      {/* <QRCode
              value={'abcccccc'} // Data to encode
              
              
            /> */}
            </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoCard: {
    marginBottom: 20,
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
  button: {
    backgroundColor: '#3498DB',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonLoading: {
    backgroundColor: '#A9CCE3',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay
  },
  qrModal: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    width: 280,
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 25,
  },
});

export default WalletDashboard;
