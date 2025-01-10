import { Core } from "@walletconnect/core";
import { Web3Wallet } from "@walletconnect/web3wallet";
export const initWalletConnect = async () => {
     const core = new Core({
              projectId: 'e95d70eca48616b7ece37471538cb064', // Replace with your project ID
            });
    const web3wallet = await Web3Wallet.init({
        core:core,
      metadata: {
        name: "My Wallet", // Your wallet name
        description: "My custom wallet for WalletConnect",
        url: "https://mywallet.com", // Your wallet's website URL
        icons: ["https://mywallet.com/icon.png"], // Icon URL
      },
      name:'acb',

    });
  
    return web3wallet;
  };