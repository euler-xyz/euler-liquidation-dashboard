import React from 'react';
import { Typography, Box } from '@mui/material';
import AccountList from '../components/AccountList';

const Dashboard: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Account Health Dashboard
      </Typography>
      <AccountList />
    </Box>
  );
};

export default Dashboard;