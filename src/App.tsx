import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link as RouterLink } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, AppBar, Toolbar, Container, Box, Link } from '@mui/material';
import RiskDashboard from './pages/RiskDashboard';

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
                to="/mainnet" 
                color="inherit" 
                underline="none"
                sx={{ '&:hover': { textDecoration: 'underline' } }}
              >
                Mainnet
              </Link>
              <Link 
                component={RouterLink} 
                to="/base" 
                color="inherit" 
                underline="none"
                sx={{ '&:hover': { textDecoration: 'underline' } }}
              >
                Base
              </Link>
              <Link 
                component={RouterLink} 
                to="/swell" 
                color="inherit" 
                underline="none"
                sx={{ '&:hover': { textDecoration: 'underline' } }}
              >
                Swell
              </Link>
              <Link 
                component={RouterLink} 
                to="/sonic" 
                color="inherit" 
                underline="none"
                sx={{ '&:hover': { textDecoration: 'underline' } }}
              >
                Sonic
              </Link>
            </Box>
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
              {/* <ConnectWallet /> */}
            </Box>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Routes>
            <Route path="/" element={<RiskDashboard chainId="1" />} />
            <Route path="/mainnet" element={<RiskDashboard chainId="1" />} />
            <Route path="/base" element={<RiskDashboard chainId="8453" />} />
            <Route path="/swell" element={<RiskDashboard chainId="1923" />} />
            <Route path="/sonic" element={<RiskDashboard chainId="146" />} />
          </Routes>
        </Container>
      </Router>
    </ThemeProvider>
  );
};

export default App;
