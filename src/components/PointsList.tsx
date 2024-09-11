import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
    Typography, CircularProgress, Link, TableSortLabel, Button, Tabs, Tab,
    Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, Box, Avatar,
    Tooltip, IconButton
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import HistoryPlot from './HistoryPlot';

// Import the JSON files
import entitiesData from '../json/entities.json';
import vaultsData from '../json/vaults.json';

interface Account {
    address: string;
    lpXP?: number;
    vcXP?: number;
    rank: number;
    accrualRatePerDay?: number;
}

interface VaultDialogProps {
    open: boolean;
    onClose: () => void;
    creatorAddress: string;
    vaults: string[];
}

type SortField = 'lpXP' | 'vcXP' | 'rank' | 'accrualRatePerDay';
type SortOrder = 'asc' | 'desc';
type TabValue = 'depositors' | 'creators';

const VaultDialog: React.FC<VaultDialogProps> = ({ open, onClose, creatorAddress, vaults }) => {
    const creatorInfo = (entitiesData as any)[creatorAddress];
    const creatorName = creatorInfo?.name || creatorAddress;
    const creatorLogo = creatorInfo?.logo;
    const creatorDescription = creatorInfo?.description;
    
    console.log('Vaults data:', vaultsData);
    console.log('Vaults for creator:', vaults);

    // Create a case-insensitive lookup for vault addresses
    const vaultLookup = Object.keys(vaultsData).reduce((acc, key) => {
        acc[key.toLowerCase()] = (vaultsData as any)[key];
        return acc;
    }, {} as Record<string, any>);

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>
                <Box display="flex" alignItems="center">
                    {creatorLogo && (
                        <Avatar 
                            src={`${process.env.PUBLIC_URL}/${creatorLogo}`} 
                            alt={creatorName}
                            sx={{ width: 24, height: 24, marginRight: 1 }}
                        />
                    )}
                    Vaults created by {creatorName}
                    {creatorDescription && (
                        <Tooltip title={creatorDescription}>
                            <IconButton size="small" sx={{ marginLeft: 1 }}>
                                <InfoIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </DialogTitle>
            <DialogContent>
                <List>
                    {vaults.map((vault) => {
                        const vaultInfo = vaultLookup[vault.toLowerCase()];
                        const vaultName = vaultInfo?.name || vault;
                        const vaultDescription = vaultInfo?.description;
                        return (
                            <ListItem key={vault}>
                                <Box display="flex" alignItems="center">
                                    <Link 
                                        href={`${process.env.REACT_APP_EULER_URL}/vault/${vault}`}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                    >
                                        {vaultName}
                                    </Link>
                                    {vaultDescription && (
                                        <Tooltip title={vaultDescription}>
                                            <IconButton size="small" sx={{ marginLeft: 1 }}>
                                                <InfoIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </Box>
                            </ListItem>
                        );
                    })}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

const PointsList: React.FC = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortField, setSortField] = useState<SortField>('rank');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
    const [tabValue, setTabValue] = useState<TabValue>('depositors');
    const [vaultDialogOpen, setVaultDialogOpen] = useState(false);
    const [selectedCreator, setSelectedCreator] = useState<string>('');
    const [creatorVaults, setCreatorVaults] = useState<string[]>([]);

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                setLoading(true);
                setError(null);
                const endpoint = tabValue === 'depositors' ? '/xp/depositors' : '/xp/creators';
                const response = await axios.get(`${process.env.REACT_APP_POINTS_URL}${endpoint}`);
                const accountsData = response.data;

                if (tabValue === 'depositors') {
                    // Fetch accrual rates for depositors
                    const accountsWithRates = await Promise.all(accountsData.map(async (account: Account) => {
                        try {
                            const rateResponse = await axios.get(`${process.env.REACT_APP_POINTS_URL}/xp/depositor/rate`, {
                                params: { address: account.address }
                            });
                            return {
                                ...account,
                                accrualRatePerDay: rateResponse.data.accrual_rate_per_day
                            };
                        } catch (error) {
                            console.error(`Failed to fetch rate for ${account.address}:`, error);
                            return account;
                        }
                    }));
                    setAccounts(accountsWithRates);
                } else {
                    setAccounts(accountsData);
                }
            } catch (error) {
                console.error('Failed to fetch accounts:', error);
                setError(`Failed to fetch accounts: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
                setLoading(false);
            }
        };

        fetchAccounts();
        const interval = setInterval(fetchAccounts, 60000); // Refresh every minute

        return () => clearInterval(interval);
    }, [tabValue]);

    const formatXP = (xp: number): string => {
        return xp.toLocaleString('en-US', { maximumFractionDigits: 2 });
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const handlePlotClick = (address: string) => {
        setSelectedAddress(address);
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: TabValue) => {
        setTabValue(newValue);
        setSortField('rank');
        setSortOrder('asc');
    };

    const handleVaultClick = async (creatorAddress: string) => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_POINTS_URL}/xp/vaults/creator`, {
                params: { address: creatorAddress }
            });
            setCreatorVaults(response.data);
            setSelectedCreator(creatorAddress);
            setVaultDialogOpen(true);
        } catch (error) {
            console.error('Failed to fetch creator vaults:', error);
        }
    };

    const getDisplayName = (address: string, isCreator: boolean) => {
        if (isCreator) {
            return (entitiesData as any)[address]?.name || address;
        } else {
            const vaultInfo = Object.entries(vaultsData).find(
                ([key]) => key.toLowerCase() === address.toLowerCase()
            );
            return vaultInfo ? vaultInfo[1].name : address;
        }
    };

    const sortedAccounts = [...accounts].sort((a, b) => {
        const multiplier = sortOrder === 'asc' ? 1 : -1;
        if (sortField === 'lpXP' || sortField === 'vcXP') {
            return ((a[sortField] || 0) - (b[sortField] || 0)) * multiplier;
        } else if (sortField === 'accrualRatePerDay') {
            return ((a.accrualRatePerDay || 0) - (b.accrualRatePerDay || 0)) * multiplier;
        } else {
            return (a.rank - b.rank) * multiplier;
        }
    });

    if (selectedAddress) {
        return <HistoryPlot address={selectedAddress} onClose={() => setSelectedAddress(null)} />;
    }

    if (loading) {
        return <CircularProgress />;
    }

    if (error) {
        return <Typography color="error">{error}</Typography>;
    }

    if (accounts.length === 0) {
        return <Typography>No accounts found.</Typography>;
    }

    return (
        <>
            <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Depositors" value="depositors" />
                <Tab label="Creators" value="creators" />
            </Tabs>
            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Rank</TableCell>
                            <TableCell>Address</TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortField === (tabValue === 'depositors' ? 'lpXP' : 'vcXP')}
                                    direction={sortField === (tabValue === 'depositors' ? 'lpXP' : 'vcXP') ? sortOrder : 'asc'}
                                    onClick={() => handleSort(tabValue === 'depositors' ? 'lpXP' : 'vcXP')}
                                >
                                    {tabValue === 'depositors' ? 'lpXP' : 'vcXP'}
                                </TableSortLabel>
                            </TableCell>
                            {tabValue === 'depositors' && (
                                <>
                                    <TableCell>
                                        <TableSortLabel
                                            active={sortField === 'accrualRatePerDay'}
                                            direction={sortField === 'accrualRatePerDay' ? sortOrder : 'asc'}
                                            onClick={() => handleSort('accrualRatePerDay')}
                                        >
                                            lpXP/Day
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>History</TableCell>
                                </>
                            )}
                            {tabValue === 'creators' && (
                                <TableCell>Vaults</TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedAccounts.map((account) => (
                            <TableRow key={account.address}>
                                <TableCell>{account.rank}</TableCell>
                                <TableCell>
                                    <Box display="flex" alignItems="center">
                                        {tabValue === 'creators' && (entitiesData as any)[account.address]?.logo && (
                                            <Avatar 
                                                src={`${process.env.PUBLIC_URL}/${(entitiesData as any)[account.address].logo}`} 
                                                alt={getDisplayName(account.address, tabValue === 'creators')}
                                                sx={{ width: 24, height: 24, marginRight: 1 }}
                                            />
                                        )}
                                        <Link 
                                            href={`${process.env.REACT_APP_EULER_URL}/?spy=${account.address}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                        >
                                            {getDisplayName(account.address, tabValue === 'creators')}
                                        </Link>
                                        {tabValue === 'creators' && (entitiesData as any)[account.address]?.description && (
                                            <Tooltip title={(entitiesData as any)[account.address].description}>
                                                <IconButton size="small" sx={{ marginLeft: 1 }}>
                                                    <InfoIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell>{formatXP(tabValue === 'depositors' ? account.lpXP || 0 : account.vcXP || 0)}</TableCell>
                                {tabValue === 'depositors' && (
                                    <>
                                        <TableCell>{formatXP(account.accrualRatePerDay || 0)}</TableCell>
                                        <TableCell>
                                            <Button 
                                                variant="contained" 
                                                onClick={() => handlePlotClick(account.address)}
                                            >
                                                View
                                            </Button>
                                        </TableCell>
                                    </>
                                )}
                                {tabValue === 'creators' && (
                                    <TableCell>
                                        <Button 
                                            variant="contained" 
                                            onClick={() => handleVaultClick(account.address)}
                                        >
                                            View Vaults
                                        </Button>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <VaultDialog 
                open={vaultDialogOpen}
                onClose={() => setVaultDialogOpen(false)}
                creatorAddress={selectedCreator}
                vaults={creatorVaults}
            />
        </>
    );
};

export default PointsList;