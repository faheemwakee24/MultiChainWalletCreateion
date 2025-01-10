import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import {ethers} from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getProvider} from '../../Web3Helpers/Provider';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';

const SendFundsScreen = () => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [scannedData, setScannedData] = useState(null);
  const [amountToSend, setAmountToSend] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isScanning, setScanning] = useState(false);
  const device = useCameraDevice('back');
  const {hasPermission} = useCameraPermission();

  if (!hasPermission) {
    return <Text>No camera permissions granted.</Text>;
  }

  if (!device) {
    return <Text>No camera device found.</Text>;
  }

  const RPC_URL = 'https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID';
  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'], // Types of codes to scan
    onCodeScanned: codes => {
      console.log(`Scanned ${codes.length} codes!`, codes);

      // Assuming `codes` is an array of scanned results
      if (codes.length > 0) {
        const scannedValue = codes[0]?.value;
        const firstCode = codes[0].content;
        setRecipientAddress(scannedValue); // Set the first scanned code
        Alert.alert('Code Scanned!', `Data: ${scannedValue}`);
        console.log('scannedValue', scannedValue);
        setScanning(false);
      }
    },
  });

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

  const sendFunds = async () => {
    if (!recipientAddress || !ethers.isAddress(recipientAddress)) {
      Alert.alert(
        'Invalid Address',
        'Please provide a valid recipient address.',
      );
      return;
    }

    if (!amountToSend || isNaN(amountToSend) || Number(amountToSend) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to send.');
      return;
    }

    try {
      setIsSending(true);

      // Fetch private key from AsyncStorage
      const privateKey = await fetchPrivateKey();
      if (!privateKey) return;

      // Initialize the provider
      const provider = getProvider();

      // Create a wallet instance
      const wallet = new ethers.Wallet(privateKey, provider);

      // Create transaction object
      const tx = {
        to: recipientAddress,
        value: ethers.parseEther(amountToSend),
      };

      // Send transaction
      const txResponse = await wallet.sendTransaction(tx);
      console.log('Transaction Response:', txResponse);

      // Wait for the transaction to be mined
      await txResponse.wait();

      Alert.alert(
        'Success',
        `Transaction successful!\nHash: ${txResponse.hash}`,
      );
      setRecipientAddress('');
      setAmountToSend('');
    } catch (error) {
      console.error('Error sending funds:', error.message);
      Alert.alert('Error', error.message);
    } finally {
      setIsSending(false);
    }
  };
  const onSuccess = e => {
    Linking.openURL(e.data).catch(err =>
      console.error('An error occured', err),
    );
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Send Funds</Text>

      <TextInput
        style={styles.input}
        placeholder="Recipient Address"
        value={recipientAddress}
        onChangeText={setRecipientAddress}
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={[styles.button, isSending && styles.buttonDisabled]}
        onPress={() => {
          setScanning(!isScanning);
        }}
        disabled={isSending}>
        <Text style={styles.buttonText}>Scan QR Code</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Amount in ETH"
        value={amountToSend}
        onChangeText={setAmountToSend}
        keyboardType="numeric"
      />

      <TouchableOpacity
        style={[styles.button, isSending && styles.buttonDisabled]}
        onPress={sendFunds}
        disabled={isSending}>
        <Text style={styles.buttonText}>
          {isSending ? 'Sending...' : 'Send'}
        </Text>
      </TouchableOpacity>
      {isScanning && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          photo={true} // Enable photo capture
          video={true} // Enable video capture (optional)
          audio={false} // Disable audio capture
          codeScanner={codeScanner}
        />
      )}
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
  buttonDisabled: {
    backgroundColor: '#A9CCE3',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SendFundsScreen;
