import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Image,
} from 'react-native';
import {ethers} from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getProvider} from '../../Web3Helpers/Provider';
import {useNavigation} from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import CloseCircle from '../../Assests/Svgs/CloseCircle.svg';
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
  SystemProgram,
} from '@solana/web3.js';
import 'react-native-blob-util'; // Polyfill for fetch
import axios from 'axios';
import SendIcon from '../../Assests/Svgs/SendIcon.svg';
import Clipboard from '@react-native-clipboard/clipboard';
const WalletDashboard = () => {
  const navigation = useNavigation();
  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState('');
  const [providerName, setProviderName] = useState('');
  const [EthPrice, setEthPrice] = useState(0);
  const [SOLPrice, setSOLPrice] = useState(0);
  const [SOLwalletAddress, SOLsetWalletAddress] = useState(
    '4kHi6DPUHGLkF7vdfHwrSr8ncF9nXKtkyq8GhgbBxnHW',
  );
  const [SOLwalletBalance, setSOLWalletBalance] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const data = 'Hello, this is the data to encode in the QR code!'; // Your QR code data

  const getSolanaBalance = async () => {
    try {
      console.log('fetch', fetch);
      const connection = new Connection(
        clusterApiUrl('devnet'),
        'https://api.devnet.solana.com',
      ); // Connect to Devnet
      const wallet = new PublicKey(SOLwalletAddress); // Wallet address
      const balance = await connection.getBalance(wallet); // Get balance in lamports
      console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
      Alert.alert(
        'Solana Balance',
        `Balance: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`,
      );
      setSOLWalletBalance((balance / LAMPORTS_PER_SOL).toFixed(4));
    } catch (error) {
      console.log('Error getting balance', error);
      Alert.alert('Error', 'Failed to fetch Solana balance');
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
      const provider = getProvider();
      const network = await provider.getNetwork();
      console.log('provider', network);
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
    navigation.navigate('SendFundsScreen');
  };

  const receiveFunds = () => {
    Alert.alert('Receive Funds', `Wallet Address:\n${walletAddress}`);
  };

  const [cryptoPrices, setCryptoPrices] = useState([]);

  const fetchCryptoPrices = async () => {
    try {
      setIsLoading(true);

      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,cardano,polkadot,chainlink,uniswap,binancecoin,polygon,TRUFF&vs_currencies=usd&include_24hr_change=true',
      );

      const prices = response.data;
      const formattedPrices = Object.keys(prices).map(key =>{
        console.log('abc',key)
        if(key=='solana'){
console.log('SOL price',prices[key].usd)
setSOLPrice(prices[key].usd)
        }else if(key=='ethereum'){
          console.log('Eth price',prices[key].usd)
          setEthPrice(prices[key].usd)
        }
        return({
        name: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize the name
        price: prices[key].usd,
        change: prices[key].usd_24h_change?.toFixed(2), // Round percentage change to 2 decimals
      })});
      console.log('crypto pricesss', formattedPrices);

      setCryptoPrices(formattedPrices);
    } catch (error) {
      console.error('Error fetching crypto prices:', error.message);
      Alert.alert('Error', 'Failed to fetch crypto prices.');
    } finally {
      setIsLoading(false);
    }
  };
  function formatNumber(number) {
    if (number >= 1e9) {
      return (number / 1e9).toFixed(5).replace(/(\.\d*?[1-9])0+$/, "$1") + 'B'; // Convert to billions with max 5 digits after the decimal
    } else if (number >= 1e6) {
      return (number / 1e6).toFixed(5).replace(/(\.\d*?[1-9])0+$/, "$1") + 'M'; // Convert to millions with max 5 digits after the decimal
    } else {
      return number.toFixed(5).replace(/(\.\d*?[1-9])0+$/, "$1"); // Return number as-is if it's less than a million
    }
  }
  const FetchBalance = () => {
    getSolanaBalance();
    fetchCryptoPrices();
    fetchWalletDetails();
  };
  useEffect(() => {
    // Fetch wallet details on component mount
    FetchBalance();
  }, []);

  console.log('walletAddress', walletAddress);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>$ {formatNumber((11.11000))}</Text>
        <View
          style={styles.Row}>
          <TouchableOpacity onPress={toggleModal} style={styles.InnerContainer}>
            <Image
              source={require('../../Assests/Svgs/ReciveImage.png')}
              style={styles.IconImage}
            />
            <Text style={styles.title2}>Receive</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={sendFunds} style={styles.InnerContainer}>
            <Image
              source={require('../../Assests/Svgs/SendImage.png')}
              style={styles.IconImage}
            />
            <Text style={styles.title2}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.InnerContainer}>
            <Image
              source={require('../../Assests/Svgs/SwapImaeg.png')}
              style={styles.IconImage}
            />
            <Text style={styles.title2}>Swap</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.InnerContainer}>
            <Image
              source={require('../../Assests/Svgs/BuyImage.png')}
              style={styles.IconImage}
            />
            <Text style={styles.title2}>Buy</Text>
          </TouchableOpacity>
                  </View>
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
        {SOLwalletAddress && (
          <View style={styles.infoCard}>
            <TouchableOpacity onPress={()=>{Clipboard.setString('abccc');}}><Text style={styles.label}>{SOLwalletAddress ? SOLwalletAddress.slice(0, 10) + "..." : ''}</Text></TouchableOpacity>
            <Text style={styles.value}>{SOLwalletBalance} SOL</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonLoading]}
          onPress={getSolanaBalance}
          disabled={isLoading}>
          <Text style={styles.buttonText}>
            {isLoading ? 'Fetching...' : 'Refetch Balance'}
          </Text>
        </TouchableOpacity>

  

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('ConnectWallet')}>
          <Text style={styles.buttonText}>Connect Wallet</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('ConnectMYWallet')}>
          <Text style={styles.buttonText}>Scan To connect Wallet</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('BrowserHome')}>
          <Text style={styles.buttonText}>Browser</Text>
        </TouchableOpacity>
        {cryptoPrices.length > 0 ? (
          cryptoPrices.map((crypto, index) => (
            <View key={index} style={styles.cryptoCard}>
              <Text style={styles.cryptoName}>{crypto.name}</Text>
              <Text style={styles.cryptoPrice}>
                ${crypto.price.toLocaleString()}
              </Text>
              <Text
                style={[
                  styles.cryptoChange,
                  crypto.change > 0
                    ? styles.positiveChange
                    : styles.negativeChange,
                ]}>
                {crypto.change > 0 ? `+${crypto.change}%` : `${crypto.change}%`}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.loadingText}>
            {isLoading ? 'Fetching prices...' : 'No data available'}
          </Text>
        )}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={toggleModal}
          onTouchCancel={toggleModal}>
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 1)',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color:'#FFFFFF'
  },
  
  title2: {
    fontSize: 15,
    
    textAlign: 'center',
    color:'#FFFFFF'
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
  
  scrollContainer: {
    flex: 1,
  },
  cryptoCard: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCC',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cryptoName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cryptoPrice: {
    fontSize: 16,
  },
  cryptoChange: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  positiveChange: {
    color: '#28A745',
  },
  negativeChange: {
    color: '#DC3545',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
  },
  button: {
    backgroundColor: '#3498DB',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  Row:{
    flexDirection: 'row',
    width: '100%',
    padding: 10,
    gap: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  InnerContainer:{justifyContent: 'center', alignItems: 'center'},
  IconImage:{height: 60, width: 60}
});

export default WalletDashboard;
