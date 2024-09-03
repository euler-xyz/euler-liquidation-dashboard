import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BrowserProvider, Contract, parseEther } from 'ethers';
import { TextField, Button, Grid, Typography, Box, Paper } from '@mui/material';
import liquidatorABI from '../abi/Liquidator.json';

const LiquidationForm: React.FC = () => {
  const [formData, setFormData] = useState({
    violatorAddress: '',
    vault: '',
    borrowedAsset: '',
    collateralVault: '',
    collateralAsset: '',
    repayAmount: '',
    seizedCollateralAmount: '',
    swapAmount: '',
    expectedRemainingCollateral: '',
    swapType: '',
    swapData: '',
    receiver: '',
  });
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setFormData(prevState => ({
      ...prevState,
      violatorAddress: params.get('violator') || '',
      vault: params.get('vault') || '',
      borrowedAsset: params.get('borrowed_asset') || '',
      collateralVault: params.get('collateral_vault') || '',
      collateralAsset: params.get('collateral_asset') || '',
      repayAmount: params.get('max_repay') || '',
      seizedCollateralAmount: params.get('seized_collateral_shares') || '',
      swapAmount: params.get('swap_amount') || '',
      expectedRemainingCollateral: params.get('leftover_collateral') || '',
      swapType: '1', // Assuming 1 for 1inch, you might want to adjust this based on your needs
      swapData: params.get('swap_data_1inch') || '',
      receiver: params.get('receiver') || '',
    }));
  }, [location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        // Replace with your actual contract address
        const contractAddress = '0x...';
        const contract = new Contract(contractAddress, liquidatorABI.abi, signer);

        // Prepare the liquidation parameters
        const params = {
          violatorAddress: formData.violatorAddress,
          vault: formData.vault,
          borrowedAsset: formData.borrowedAsset,
          collateralVault: formData.collateralVault,
          collateralAsset: formData.collateralAsset,
          repayAmount: parseEther(formData.repayAmount),
          seizedCollateralAmount: parseEther(formData.seizedCollateralAmount),
          swapAmount: parseEther(formData.swapAmount),
          expectedRemainingCollateral: parseEther(formData.expectedRemainingCollateral),
          swapType: BigInt(formData.swapType),
          swapData: formData.swapData,
          receiver: formData.receiver,
        };

        // Call the liquidation function on your contract
        const tx = await contract.liquidate_single_collateral(params);
        await tx.wait();
        alert('Liquidation executed successfully!');
      } catch (error) {
        console.error('Liquidation failed:', error);
        alert('Liquidation failed. Check console for details.');
      }
    } else {
      alert('Please connect your wallet first!');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
        <Grid container spacing={2}>
          {Object.entries(formData).map(([key, value]) => (
            <Grid item xs={12} sm={6} key={key}>
              <TextField
                fullWidth
                id={key}
                name={key}
                label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                value={value}
                onChange={handleChange}
                required
              />
            </Grid>
          ))}
        </Grid>
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
        >
          Execute Liquidation
        </Button>
      </Box>
    </Paper>
  );
};

export default LiquidationForm;