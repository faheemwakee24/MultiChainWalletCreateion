// provider.js
import { ethers } from 'ethers';

export const getProvider = () => {
  try {
    return new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/9c97c625af5b46a6a8ef6d7fc488b766');
  } catch (error) {
    console.error('Error initializing provider:', error.message);
    throw new Error('Failed to initialize provider.');
  }
};

