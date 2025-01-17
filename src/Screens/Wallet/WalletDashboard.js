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
  RefreshControl,
  StatusBar,
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
import { CHAIN_ID_ETH, CHAIN_ID_SOLANA, getEmitterAddressEth, parseSequenceFromLogEth } from "@wormhole-foundation/sdk";
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

  const [activeRecive, setactiveRecive] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isRefreshing, setRefreshing] = useState(false);
  

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

      setSOLWalletBalance(balance / LAMPORTS_PER_SOL);
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
      const formattedPrices = Object.keys(prices).map(key => {
        console.log('abc', key);
        if (key == 'solana') {
          console.log('SOL price', prices[key].usd);
          setSOLPrice(prices[key].usd);
        } else if (key == 'ethereum') {
          console.log('Eth price', prices[key].usd);
          setEthPrice(prices[key].usd);
        }
        return {
          name: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize the name
          price: prices[key].usd,
          change: prices[key].usd_24h_change?.toFixed(2), // Round percentage change to 2 decimals
        };
      });
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
      return (number / 1e9).toFixed(5).replace(/(\.\d*?[1-9])0+$/, '$1') + 'B'; // Convert to billions with max 5 digits after the decimal
    } else if (number >= 1e6) {
      return (number / 1e6).toFixed(5).replace(/(\.\d*?[1-9])0+$/, '$1') + 'M'; // Convert to millions with max 5 digits after the decimal
    } else {
      return number.toFixed(5).replace(/(\.\d*?[1-9])0+$/, '$1'); // Return number as-is if it's less than a million
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
  const onRefresh = () => {
    setRefreshing(true);
    FetchBalance();
    setTimeout(() => setRefreshing(false), 1500); // Stop refreshing after 1.5s
  };
  return (
    <View style={styles.container}>
      
      <View style={styles.Row2}>


      <Image
              source={require('../../Assests/Svgs/ProfileIcon.png')}
              style={styles.IconImage2}
            />
<StatusBar backgroundColor={'#030303'} />
            <TouchableOpacity  onPress={() => navigation.navigate('ConnectMYWallet')}>
            <Image
              source={require('../../Assests/Svgs/Qrcode_2.png')}
              style={styles.IconImage2}
            />
            </TouchableOpacity>
      </View>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        style={styles.container}
        showsVerticalScrollIndicator={false}>
          
        <Text style={styles.title}>$ {formatNumber((SOLwalletBalance*SOLPrice)+(EthPrice*walletBalance))}</Text>
        <View style={styles.Row}>
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
          <TouchableOpacity
            onPress={() => {
              Clipboard.setString(walletAddress);
            }}
            style={styles.infoCard}>
                <Image
              source={require('../../Assests/Svgs/EthIcon.png')}
              style={styles.IconImage}
            />
            <View>
              <Text style={styles.label}>Etherium</Text>

              <Text style={styles.value}>{walletBalance} ETH</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <Text style={styles.loadingText}>
            {isLoading ? 'Loading...' : 'No Wallet Connected'}
          </Text>
        )}
        {SOLwalletAddress && (
          <TouchableOpacity
            onPress={() => {
              Clipboard.setString(walletAddress);
            }}
            style={styles.infoCard}>
               <Image
              source={require('../../Assests/Svgs/SOL.png')}
              style={styles.IconImage}
            />
            <View>
              <Text style={styles.label}>Solana</Text>
              <Text style={styles.value}>{SOLwalletBalance} SOL</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('ConnectWallet')}>
          <Text style={styles.buttonText}>Connect Wallet</Text>
        </TouchableOpacity> */}

        

        
        <Text style={styles.title3}>Top Tokens</Text>
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
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('BrowserHome')}>
          <Text style={styles.buttonText}>Browser</Text>
        </TouchableOpacity>
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={toggleModal}
          onTouchCancel={toggleModal}>
          <Pressable onPress={toggleModal} style={styles.overlay}>
            <Pressable style={styles.qrModal}>

              <Text style={styles.qrTitle}>QR Code</Text>
              <View style={styles.Row2}>

              <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('ConnectWallet')}>
          <Text style={ styles.buttonText}>Solana</Text>
        </TouchableOpacity> <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('ConnectWallet')}>
          <Text style={styles.buttonText}>Etherium</Text>
        </TouchableOpacity>
        </View>
              {activeRecive==0?<TouchableOpacity
                onPress={() => {
                  Clipboard.setString(walletAddress);
                }}>
                <Text style={styles.label}>
                  {walletAddress ? walletAddress.slice(0, 10) + '...' : ''}
                </Text>
              </TouchableOpacity>:<TouchableOpacity
                onPress={() => {
                  Clipboard.setString(SOLwalletAddress);
                }}>
                <Text style={styles.label}>
                  {SOLwalletAddress ? SOLwalletAddress.slice(0, 10) + '...' : ''}
                </Text>
              </TouchableOpacity>}
              
              <QRCode
                value={activeRecive==0? walletAddress:SOLwalletAddress} // Data to encode
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
    color: '#FFFFFF',
  },

  title2: {
    fontSize: 15,

    textAlign: 'center',
    color: '#FFFFFF',
  },
  title3: {
    fontSize: 20,

    marginBottom:10,
    color: '#FFFFFFFF',
  },
  infoCard: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#FFA4F1',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    width: '100%',
    gap:15
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
  
  button2: {
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
    backgroundColor: '#FFA4F1',
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
  
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  Row: {
    flexDirection: 'row',
    width: '100%',
    padding: 10,
    gap: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  Row2: {
    flexDirection: 'row',
    width: '100%',
    padding: 10,
    gap: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  Row3: {
    flexDirection: 'row',
    width: '100%',
    padding: 10,
    gap: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  InnerContainer: {justifyContent: 'center', alignItems: 'center'},
  IconImage: {height: 60, width: 60},
  IconImage2: {height: 40, width: 40},
});

export default WalletDashboard;
