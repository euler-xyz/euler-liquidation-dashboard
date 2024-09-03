import React from 'react';
import { Typography, Box } from '@mui/material';
import LiquidationForm from '../components/LiquidationForm';

const ExecuteLiquidation: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Execute Liquidation
      </Typography>
      <LiquidationForm />
    </Box>
  );
};

export default ExecuteLiquidation;