import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { decodeBase58, ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProvider } from '../../Web3Helpers/Provider';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import bs58 from 'bs58';

const SendFundsScreen = () => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [scannedData, setScannedData] = useState(null);
  const [amountToSend, setAmountToSend] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isScanning, setScanning] = useState(false);
  const [SolanaPrivateKey, setSolanaPrivateKey] = useState('');
  const [selectedBlockchain, setSelectedBlockchain] = useState('ethereum'); // 'ethereum' or 'solana'
  const device = useCameraDevice('back');
  const { hasPermission } = useCameraPermission();

  if (!hasPermission) {
    return <Text>No camera permissions granted.</Text>;
  }

  if (!device) {
    return <Text>No camera device found.</Text>;
  }

  const RPC_URL = 'https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID';
  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: codes => {
      if (codes.length > 0) {
        const scannedValue = codes[0]?.value;
        setRecipientAddress(scannedValue);
        Alert.alert('Code Scanned!', `Data: ${scannedValue}`);
        setScanning(false);
      }
    },
  });

  const fetchPrivateKey = async () => {
    try {
  
      const privateKey = await AsyncStorage.getItem('privateKey');
      const SOLprivateKey = await AsyncStorage.getItem('SOLprivateKey');
      console.log('SOL Private Key',SOLprivateKey)
      setSolanaPrivateKey(SOLprivateKey)
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
  const transferSol = async (fromSecretKey, toPublicKey, amount) => {
    try {
      console.log('from secret', fromSecretKey);
      console.log('recipient wallet address', toPublicKey);
      console.log('amount', amount);
  
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
      // Decode the base58 secret key to Uint8Array using bs58
      const decodedKey = bs58.decode(fromSecretKey);
      console.log('Decoded Secret Key:', decodedKey);
      console.log('Key Length:', decodedKey.length);
  
      // Ensure the decoded key has the correct length
      if (decodedKey.length !== 64) {
        throw new Error('Invalid secret key length. Expected 64 bytes.');
      }
  
      // Create the sender's Keypair
      const fromKeypair = Keypair.fromSecretKey(decodedKey);
  
      // Create the recipient's public key
      const toPublicKeyObj = new PublicKey(toPublicKey);
  
      // Get the latest blockhash
      const { blockhash } = await connection.getRecentBlockhash();
  
      // Create the transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromKeypair.publicKey,
          toPubkey: toPublicKeyObj,
          lamports: amount * 1e9, // Convert SOL to lamports (1 SOL = 10^9 lamports)
        })
      );
  
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromKeypair.publicKey;
  
      // Sign the transaction with the sender's private key
      transaction.sign(fromKeypair);
  
      // Send the transaction
      const txId = await connection.sendRawTransaction(transaction.serialize());
  
      // Confirm the transaction
      await connection.confirmTransaction(txId, 'confirmed');
      const transactionDetails = await connection.getTransaction(txId);
      console.log('transaction Details',transactionDetails)
    let gasFee=0;
      if (transactionDetails && transactionDetails.meta) {
        console.log('Transaction Fee (in lamports):', transactionDetails.meta.fee);
  
        // Convert lamports to SOL (1 SOL = 10^9 lamports)
        const feeInSol = transactionDetails.meta.fee / LAMPORTS_PER_SOL;
        console.log('Transaction Fee (in SOL):', feeInSol);
        gasFee=feeInSol;
        
      } else {
        console.log('Transaction not found or meta information unavailable.');
      }
      Alert.alert('Transaction successful!', `${txId}\n\n\n\n to :${recipientAddress}   \n\n Amount in ${selectedBlockchain === 'ethereum'?'ETH':'SOL'}: ${amount} \n\n\n\n gas Fee : ${gasFee}`);
      return txId;
    } catch (error) {
      console.error('Error performing transaction:', error);
    }
  };
  
  
  const sendFunds = async () => {
    if (!recipientAddress) {
      Alert.alert('Invalid Address', 'Please provide a recipient address.');
      return;
    }

    if (!amountToSend || isNaN(amountToSend) || Number(amountToSend) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to send.');
      return;
    }

    try {
      setIsSending(true);
      const privateKey = await fetchPrivateKey();
      if (!privateKey) return;
      if (selectedBlockchain === 'ethereum') {
        // Ethereum-specific logic
  
      

        const provider = getProvider();
        const wallet = new ethers.Wallet(privateKey, provider);
        const tx = {
          to: recipientAddress,
          value: ethers.parseEther(amountToSend),
        };
        const txResponse = await wallet.sendTransaction(tx);
        await txResponse.wait();

        Alert.alert('Success', `Transaction successful!\nHash: ${txResponse.hash}`);
      } else if (selectedBlockchain === 'solana') {
        transferSol(SolanaPrivateKey,recipientAddress,amountToSend)
        // Solana-specific logic (placeholder, implement actual Solana transaction logic here)
        // Alert.alert(
        //   'Solana Transaction',
        //   `Sending ${amountToSend} SOL to ${recipientAddress}.`
        // );
        
      }

      setRecipientAddress('');
      setAmountToSend('');
    } catch (error) {
      console.error('Error sending funds:', error.message);
      Alert.alert('Error', error.message);
    } finally {
      setIsSending(false);
    }
  };
  useEffect(()=>{
    fetchPrivateKey()
  },[])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Send Funds</Text>

      {/* Blockchain Selector */}
      <View style={styles.blockchainSelector}>
        <TouchableOpacity
          style={[
            styles.blockchainButton,
            selectedBlockchain === 'ethereum' && styles.selectedButton,
          ]}
          onPress={() => setSelectedBlockchain('ethereum')}>
          <Text style={styles.blockchainText}>Ethereum</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.blockchainButton,
            selectedBlockchain === 'solana' && styles.selectedButton,
          ]}
          onPress={() => setSelectedBlockchain('solana')}>
          <Text style={styles.blockchainText}>Solana</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Recipient Address"
        value={recipientAddress}
        onChangeText={setRecipientAddress}
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={[styles.button, isSending && styles.buttonDisabled]}
        onPress={() => setScanning(!isScanning)}
        disabled={isSending}>
        <Text style={styles.buttonText}>Scan QR Code</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder={`Amount in ${selectedBlockchain === 'ethereum' ? 'ETH' : 'SOL'}`}
        value={amountToSend}
        onChangeText={setAmountToSend}
        keyboardType="numeric"
      />

      <TouchableOpacity
        style={[styles.button, isSending && styles.buttonDisabled]}
        onPress={sendFunds}
        disabled={isSending}>
        <Text style={styles.buttonText}>{isSending ? 'Sending...' : 'Send'}</Text>
      </TouchableOpacity>

      {isScanning && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          photo={true}
          video={true}
          audio={false}
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
  blockchainSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  blockchainButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: '#CCC',
  },
  selectedButton: {
    backgroundColor: '#3498DB',
  },
  blockchainText: {
    color: '#FFF',
    fontWeight: 'bold',
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
