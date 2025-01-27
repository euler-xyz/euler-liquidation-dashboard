import React from 'react';
import { Typography, Box } from '@mui/material';
import AccountList from '../components/AccountList';

interface RiskDashboardProps {
  chainId: string;
}

const RiskDashboard: React.FC<RiskDashboardProps> = ({ chainId }) => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Risk Dashboard
      </Typography>
      <AccountList chainId={chainId} />
    </Box>
  );
};

export default RiskDashboard;