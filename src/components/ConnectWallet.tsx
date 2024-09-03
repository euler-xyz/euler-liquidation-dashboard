import React, { useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';
import { Button, Typography, Box } from '@mui/material';

const ConnectWallet: React.FC = () => {
  const [account, setAccount] = useState<string | null>(null);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    // Note: There's no standard way to programmatically disconnect a wallet.
    // This just clears the account from the app's state.
    // The user would need to disconnect manually from their wallet interface.
    console.log('Wallet disconnected from the app. Please disconnect manually from your wallet if needed.');
  };

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setAccount(accounts[0] || null);
      });
    }
  }, []);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {account ? (
        <>
          <Typography variant="body2" sx={{ color: 'white', bgcolor: 'primary.main', padding: '6px 16px', borderRadius: '4px' }}>
            {account.slice(0, 6)}...{account.slice(-4)}
          </Typography>
          <Button variant="outlined" onClick={disconnectWallet} size="small">
            Disconnect
          </Button>
        </>
      ) : (
        <Button variant="contained" onClick={connectWallet} size="small">
          Connect Wallet
        </Button>
      )}
    </Box>
  );
};

export default ConnectWallet;