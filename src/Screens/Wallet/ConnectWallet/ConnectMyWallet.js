
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
} from 'react-native';

import { Camera } from 'react-native-vision-camera';
import { useCameraPermission, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import '@walletconnect/react-native-compat';
import { Core } from '@walletconnect/core';
import { Web3Wallet } from '@walletconnect/web3wallet';

// Initialize WalletConnect
const initWalletConnect = async () => {
  try {
    const core = new Core({
      projectId: 'e95d70eca48616b7ece37471538cb064', // Your WalletConnect project ID
    });

    const web3wallet = await Web3Wallet.init({
      core,
      metadata: {
        name: "My Wallet",
        description: "My custom wallet for WalletConnect",
        url: "https://mywallet.com",
        icons: ["https://mywallet.com/icon.png"],
      },
      name: 'acb',
    });

    console.log('Web3Wallet initialized successfully:', web3wallet);

    return web3wallet;
  } catch (error) {
    console.error('Error initializing WalletConnect:', error);
    return null;
  }
};


// Connect and pair with WalletConnect URI
const pairWalletConnect = async (web3wallet, uri) => {
  try {
    if (!web3wallet || !web3wallet.core) {
      throw new Error('Web3Wallet or core is not initialized properly.');
    }

    if (!uri) {
      throw new Error('URI is not provided or invalid.');
    }

    // Now pair with the dApp's URI
    await web3wallet.core.pairing.pair({ uri });
    console.log('WalletConnect pairing successful.');

    web3wallet.on('session_proposal', async (proposal) => {
      try {
        console.log('Session proposal received:', proposal);

        const namespaces = {
          eip155: {
            accounts: [`eip155:11155111:0x8b1D35A7782Da93dDd9B50117f625EA36DB50251`], // Address on Spolia testnet
            methods: ["eth_sendTransaction", "personal_sign"], // Allowed actions
            events: ["accountsChanged"], // Subscribed events
          },
        };
        const session = await web3wallet.approveSession({
          id: proposal.id,
          namespaces,
        });

        console.log('Session approved:', session);
      } catch (error) {
        console.error('Error approving session:', error);
      }
    });
  } catch (error) {
    console.error('Error during WalletConnect pairing:', error);
  }
};


// Main component for wallet connection
const ConnectMyWallet = () => {
  const [scanedData, setScanedData] = useState('');
  const [isScanning, setScanning] = useState(false);
  const [web3wallet, setWeb3Wallet] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const device = useCameraDevice('back');
  const { hasPermission } = useCameraPermission();

  useEffect(() => {
    const initializeWallet = async () => {
      const wallet = await initWalletConnect();
      if (wallet) {
        setWeb3Wallet(wallet);
      }
    };

    initializeWallet();
  }, []);

  if (!hasPermission) {
    return <Text>No camera permissions granted.</Text>;
  }

  if (!device) {
    return <Text>No camera device found.</Text>;
  }

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (codes.length > 0) {
        const scannedValue = codes[0]?.value;
        setScanedData(scannedValue);
        Alert.alert('Code Scanned!', `Data: ${scannedValue}`);
        
        // Pair with WalletConnect URI after approving session
        if (web3wallet && scannedValue) {
          pairWalletConnect(web3wallet, scannedValue);
        }
        setScanning(false);
      }
    },
  });
  const getSessions = async () => {
    if (!web3wallet) {
      Alert.alert('Wallet not initialized.');
      return;
    }

    try {
      setLoading(true);
      const sessions = web3wallet.getActiveSessions();
      const sessionArray = Object.keys(sessions).map((key) => ({
        id: key,
        ...sessions[key],
      }));
      setActiveSessions(sessionArray);
    } catch (error) {
      console.error('Error fetching active sessions:', error);
    } finally {
      setLoading(false);
    }
  };
  const renderSessionItem = ({ item }) => {
    const peerMetadata = item.peer?.metadata || {};
    const expiry = new Date(item.expiry * 1000).toLocaleString();

    return (
      <View style={styles.sessionCard}>
        <Text style={styles.sessionText}>App Name: {peerMetadata.name || 'Unknown'}</Text>
        <Text style={styles.sessionText}>App URL: {peerMetadata.url || 'Unknown'}</Text>
        <Text style={styles.sessionText}>Expiry: {expiry}</Text>
      </View>
    );
  };
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setScanning(!isScanning)}
      >
        <Text style={styles.buttonText}>Scan QR Code</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={getSessions}
      >
        <Text style={styles.buttonText}>getActiveSessions</Text>
      </TouchableOpacity>

      <Text>Scanned Data: {scanedData}</Text>

      {isScanning && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          codeScanner={codeScanner}
        />
      )}
       <FlatList
               data={activeSessions}
        keyExtractor={(item) => item.id}
        renderItem={renderSessionItem}
        contentContainerStyle={{ marginTop: 20 }}
        ListEmptyComponent={<Text>No active sessions found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  button: {
    backgroundColor: '#3498DB',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sessionCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sessionText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  loader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loaderText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#3498DB',
  },
});


export default ConnectMyWallet;
