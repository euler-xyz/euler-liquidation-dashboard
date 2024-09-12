import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link as RouterLink } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, AppBar, Toolbar, Container, Box, Link } from '@mui/material';
import ExecuteLiquidation from './pages/ExecuteLiquidation';
import RiskDashboard from './pages/RiskDashboard';
import PointsDashboard from './pages/PointsDashboard';
import ConnectWallet from './components/ConnectWallet';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
          <Toolbar variant="dense">
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Link 
                component={RouterLink} 
                to="/" 
                color="inherit" 
                underline="none"
                sx={{ '&:hover': { textDecoration: 'underline' } }}
              >
                Risk Dashboard
              </Link>
              {/* <Link 
                component={RouterLink} 
                to="/liquidate" 
                color="inherit" 
                underline="none"
                sx={{ '&:hover': { textDecoration: 'underline' } }}
              >
                Liquidate
              </Link> */}
              <Link 
                component={RouterLink} 
                to="/points" 
                color="inherit" 
                underline="none"
                sx={{ '&:hover': { textDecoration: 'underline' } }}
              >
                Points Dashboard
              </Link>
            </Box>
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <ConnectWallet />
            </Box>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Routes>
            <Route path="/" element={<RiskDashboard />} />
            <Route path="/liquidate" element={<ExecuteLiquidation />} />
            <Route path="/points" element={<PointsDashboard />} />
          </Routes>
        </Container>
      </Router>
    </ThemeProvider>
  );
};

export default App;
