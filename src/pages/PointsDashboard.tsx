import React from 'react';
import { Typography, Box } from '@mui/material';
import PointsList from '../components/PointsList';

const Dashboard: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        EulerXP Dashboard
      </Typography>
      <PointsList />
    </Box>
  );
};

export default Dashboard;