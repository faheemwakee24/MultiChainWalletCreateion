import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ethers } from 'ethers';
import '@walletconnect/react-native-compat';
import { useWalletConnectModal, WalletConnectModal } from '@walletconnect/modal-react-native';
import { createAppKit, defaultConfig, AppKit, AppKitButton, useAppKit, } from '@reown/appkit-ethers-react-native';

const ConnectWallet = () => {
  const [walletInfo, setWalletInfo] = useState(null);
  const { open, isConnected, provider } = useWalletConnectModal();
  const projectId = 'e95d70eca48616b7ece37471538cb064';

  const providerMetadata = {
    name: 'first wallet connect',
    description: 'here is my first wallet ',
    url: 'https://jawadmovers.com/',
    icons: [
      'https://www.npmjs.com/npm-avatar/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdmF0YXJVUkwiOiJodHRwczovL3MuZ3JhdmF0YXIuY29tL2F2YXRhci84NDRmMWQzZmNkYzkyYjI5YWVhN2JjYjkzMzFlZWUwNj9zaXplPTQ5NiZkZWZhdWx0PXJldHJvIn0.DIyJQNSAGtvrdsnEnSOSemfS9zH6AiulQwl-u6C9NVg',
    ],
    redirect: {
      native: 'PracticeGoogleAdds://',
      universal: 'https://jawadmovers.com',
    },
  };

  const mainnet = {
    chainId: 1,
    name: 'Ethereum',
    currency: 'ETH',
    explorerUrl: 'https://etherscan.io',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID', // Replace with your Infura project ID
  };
  
  const polygon = {
    chainId: 137,
    name: 'Polygon',
    currency: 'MATIC',
    explorerUrl: 'https://polygonscan.com',
    rpcUrl: 'https://polygon-rpc.com',
  };
  
  const chains = [mainnet, polygon];
  
  createAppKit({
    projectId,
    chains,
    config: defaultConfig({ providerMetadata }),
    enableAnalytics: true, // Optional - defaults to your Cloud configuration
  });

  const appKit = useAppKit();

  useEffect(() => {
    const fetchWalletInfo = async () => {
      try {
        console.log('AppKit:', appKit);
        if (appKit?.wallet) {
          const wallet = appKit.wallet;
          const address = await wallet.getAddress(); // Get wallet address
          console.log('Wallet Address:', address);
  
          const provider = wallet.getProvider(); // Get wallet provider
          console.log('Provider:', provider);
  
          if (provider) {
            const balance = await provider.getBalance(address); // Fetch wallet balance
            console.log('Raw Balance:', balance.toString());
  
            const chainId = await provider.getNetwork().then(network => network.chainId); // Get Chain ID
            console.log('Chain ID:', chainId);
  
            setWalletInfo({
              address,
              balance: ethers.utils.formatEther(balance), // Convert balance to ETH
              chainId,
            });
          } else {
            console.log('Provider not initialized');
          }
        } else {
          console.log('Wallet not connected');
        }
      } catch (error) {
        console.error('Error fetching wallet info:', error);
      }
    };
  
    fetchWalletInfo();
  }, [appKit?.wallet]);
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Import Wallet</Text>
      {walletInfo && (
        <View style={styles.walletInfo}>
          <Text>Address: {walletInfo?.address}</Text>
          <Text>Chain ID: {walletInfo?.chainId}</Text>
          <Text>Balance: {walletInfo?.balance} ETH</Text>
        </View>
      )}
      <AppKitButton />
      <AppKit />
      <WalletConnectModal projectId={projectId} providerMetadata={providerMetadata} />
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
  walletInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCC',
  },
});

export default ConnectWallet;
