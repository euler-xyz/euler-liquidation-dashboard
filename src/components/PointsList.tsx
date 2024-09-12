import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

// Define types for the JSON data
type EntityData = {
    [key: string]: {
        name: string;
        logo: string;
        description?: string;
        url?: string;
        addresses: { [key: string]: string };
        social?: { [key: string]: string };
    }
};

type VaultData = {
    [key: string]: {
        name: string;
        description: string;
        entity: string;
    }
};

// Use the defined types
const entities: EntityData = entitiesData;
const vaults: VaultData = vaultsData;

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

const VaultDialog: React.FC<VaultDialogProps> = ({ open, onClose, creatorAddress, vaults: creatorVaults }) => {
    const creatorInfo = Object.values(entities).find(entity => 
        Object.keys(entity.addresses).includes(creatorAddress)
    );
    const creatorName = creatorInfo?.name || creatorAddress;
    const creatorLogo = creatorInfo?.logo;
    const creatorDescription = creatorInfo?.description;
    
    console.log('Vaults data:', vaults);
    console.log('Vaults for creator:', creatorVaults);

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
                    {creatorVaults.map((vaultAddress) => {
                        const vaultInfo = Object.entries(vaults).find(([address, info]) => 
                            address.toLowerCase() === vaultAddress.toLowerCase()
                        );
                        const vaultName = vaultInfo ? vaultInfo[1].name : vaultAddress;
                        const vaultDescription = vaultInfo ? vaultInfo[1].description : '';
                        return (
                            <ListItem key={vaultAddress}>
                                <Box display="flex" alignItems="center">
                                    <Link 
                                        href={`${process.env.REACT_APP_EULER_URL}/vault/${vaultAddress}`}
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortField, setSortField] = useState<SortField>('rank');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
    const [tabValue, setTabValue] = useState<TabValue>('depositors');
    const [vaultDialogOpen, setVaultDialogOpen] = useState(false);
    const [selectedCreator, setSelectedCreator] = useState<string>('');
    const [creatorVaults, setCreatorVaults] = useState<string[]>([]);
    const [initializationMessage, setInitializationMessage] = useState<string | null>(null);
    const [depositorAccounts, setDepositorAccounts] = useState<Account[]>([]);
    const [creatorAccounts, setCreatorAccounts] = useState<Account[]>([]);

    const fetchAccounts = useCallback(async () => {
        try {
            const endpoint = tabValue === 'depositors' ? '/xp/depositors' : '/xp/creators';
            const response = await axios.get(`${process.env.REACT_APP_POINTS_URL}${endpoint}`);
            
            if (response.data.status === "initializing") {
                setInitializationMessage(response.data.message);
                return;
            }

            const accountsData = response.data;

            if (tabValue === 'depositors') {
                // Fetch accrual rates for depositors
                const accountsWithRates = await Promise.all(accountsData.map(async (account: Account) => {
                    try {
                        const rateResponse = await axios.get(`${process.env.REACT_APP_POINTS_URL}/xp/depositor/rate`, {
                            params: { address: account.address }
                        });
                        if (rateResponse.data.status === "initializing") {
                            throw new Error(rateResponse.data.message);
                        }
                        return {
                            ...account,
                            accrualRatePerDay: rateResponse.data.accrual_rate_per_day
                        };
                    } catch (error) {
                        console.error(`Failed to fetch rate for ${account.address}:`, error);
                        return account;
                    }
                }));
                setDepositorAccounts(prev => {
                    // Only update if there are changes
                    if (JSON.stringify(prev) !== JSON.stringify(accountsWithRates)) {
                        return accountsWithRates;
                    }
                    return prev;
                });
            } else {
                setCreatorAccounts(prev => {
                    // Only update if there are changes
                    if (JSON.stringify(prev) !== JSON.stringify(accountsData)) {
                        return accountsData;
                    }
                    return prev;
                });
            }
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
            if (axios.isAxiosError(error) && error.response?.data?.status === "initializing") {
                setInitializationMessage(error.response.data.message);
            } else {
                setError(`Failed to fetch accounts: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        } finally {
            setLoading(false);
        }
    }, [tabValue]);

    useEffect(() => {
        fetchAccounts();
        const interval = setInterval(fetchAccounts, 60000); // Refresh every minute

        return () => clearInterval(interval);
    }, [fetchAccounts]);

    const currentAccounts = useMemo(() => 
        tabValue === 'depositors' ? depositorAccounts : creatorAccounts, 
    [tabValue, depositorAccounts, creatorAccounts]);

    const sortedAccounts = useMemo(() => 
        [...currentAccounts].sort((a, b) => {
            const multiplier = sortOrder === 'asc' ? 1 : -1;
            if (sortField === 'lpXP' || sortField === 'vcXP') {
                return ((a[sortField] || 0) - (b[sortField] || 0)) * multiplier;
            } else if (sortField === 'accrualRatePerDay') {
                return ((a.accrualRatePerDay || 0) - (b.accrualRatePerDay || 0)) * multiplier;
            } else {
                return (a.rank - b.rank) * multiplier;
            }
        }),
    [currentAccounts, sortField, sortOrder]);

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
        if ((newValue === 'depositors' && depositorAccounts.length === 0) ||
            (newValue === 'creators' && creatorAccounts.length === 0)) {
            setLoading(true);
        }
    };

    const handleVaultClick = async (creatorAddress: string) => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_POINTS_URL}/xp/vaults/creator`, {
                params: { address: creatorAddress }
            });
            if (response.data.status === "initializing") {
                setInitializationMessage(response.data.message);
                return;
            }
            setCreatorVaults(response.data);
            setSelectedCreator(creatorAddress);
            setVaultDialogOpen(true);
        } catch (error) {
            console.error('Failed to fetch creator vaults:', error);
        }
    };

    const getDisplayName = (address: string, isCreator: boolean) => {
        if (isCreator) {
            const entity = Object.values(entities).find(entity => 
                Object.keys(entity.addresses).includes(address)
            );
            return entity?.name || address;
        } else {
            const vault = Object.values(vaults).find(vault => vault.entity.toLowerCase() === address.toLowerCase());
            return vault?.name || address;
        }
    };

    const handleRetry = () => {
        setLoading(true);
        fetchAccounts(); // Directly call fetchAccounts instead of incrementing retryCount
    };

    if (selectedAddress) {
        return <HistoryPlot address={selectedAddress} onClose={() => setSelectedAddress(null)} />;
    }

    if (loading) {
        return <CircularProgress />;
    }

    if (initializationMessage) {
        return (
            <Box sx={{ marginTop: 2 }}>
                <Typography color="warning">
                    Warning: {initializationMessage}
                </Typography>
                <Button onClick={handleRetry} sx={{ marginTop: 1 }}>
                    Retry
                </Button>
            </Box>
        );
    }

    if (error) {
        return <Typography color="error">{error}</Typography>;
    }

    if (sortedAccounts.length === 0) {
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
                                        {tabValue === 'creators' && (() => {
                                            const entity = Object.values(entities).find(entity => 
                                                Object.keys(entity.addresses).includes(account.address)
                                            );
                                            return entity?.logo && (
                                                <Avatar 
                                                    src={`${process.env.PUBLIC_URL}/${entity.logo}`} 
                                                    alt={getDisplayName(account.address, tabValue === 'creators')}
                                                    sx={{ width: 24, height: 24, marginRight: 1 }}
                                                />
                                            );
                                        })()}
                                        <Link 
                                            href={`${process.env.REACT_APP_EULER_URL}/?spy=${account.address}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                        >
                                            {getDisplayName(account.address, tabValue === 'creators')}
                                        </Link>
                                        {tabValue === 'creators' && (() => {
                                            const entity = Object.values(entities).find(entity => 
                                                Object.keys(entity.addresses).includes(account.address)
                                            );
                                            return entity?.description && (
                                                <Tooltip title={entity.description}>
                                                    <IconButton size="small" sx={{ marginLeft: 1 }}>
                                                        <InfoIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            );
                                        })()}
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