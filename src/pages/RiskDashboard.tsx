import React from 'react';
import { Typography, Box } from '@mui/material';
import AccountList from '../components/AccountList';

const RiskDashboard: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Risk Dashboard
      </Typography>
    <AccountList />
    </Box>
  );
};

export default RiskDashboard;