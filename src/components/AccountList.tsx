import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress, Link, TableSortLabel, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent, Box } from '@mui/material';
import { formatUnits } from 'ethers';

interface Account {
    address: string;
    account_address: string;
    sub_account: string;
    health_score: number;
    value_borrowed: string;
    vault_name: string;
    vault_symbol: string;
}

type SortField = 'health_score' | 'value_borrowed';
type SortOrder = 'asc' | 'desc';

const AccountList: React.FC = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortField, setSortField] = useState<SortField>('health_score');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [vaultFilter, setVaultFilter] = useState<string>('');

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/liquidation/allPositions`);
                
                let parsedData;
                try {
                    parsedData = Array.isArray(response.data) ? response.data : JSON.parse(response.data);
                } catch (parseError) {
                    console.error('Error parsing JSON:', parseError);
                    throw new Error('Failed to parse response data');
                }
                
                if (Array.isArray(parsedData)) {
                    setAccounts(parsedData);
                } else {
                    throw new Error('Parsed data is not an array');
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
    }, []);

    const formatHealthScore = (score: number): string => {
        return score.toFixed(4);
    };

    const formatValueBorrowed = (value: string): string => {
        try {
            const bigNumberValue = BigInt(value);
            const valueInEther = parseFloat(formatUnits(bigNumberValue, 18));
            return valueInEther.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        } catch (error) {
            console.error('Error formatting value:', value, error);
            return 'Error';
        }
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder(field === 'value_borrowed' ? 'desc' : 'asc');
        }
    };

    const handleVaultFilterChange = (event: SelectChangeEvent<string>) => {
        setVaultFilter(event.target.value);
    };

    const sortedAccounts = [...accounts].sort((a, b) => {
        if (sortField === 'health_score') {
            return (a.health_score - b.health_score) * (sortOrder === 'asc' ? 1 : -1);
        } else {
            const aValue = BigInt(a.value_borrowed);
            const bValue = BigInt(b.value_borrowed);
            return (aValue > bValue ? -1 : aValue < bValue ? 1 : 0) * (sortOrder === 'asc' ? -1 : 1);
        }
    });

    const filteredAccounts = sortedAccounts.filter(account => 
        vaultFilter === '' || account.vault_symbol === vaultFilter
    );

    const uniqueVaultSymbols = Array.from(new Set(accounts.map(account => account.vault_symbol)));

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
        <TableContainer component={Paper} elevation={2}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Address</TableCell>
                        <TableCell>
                            <TableSortLabel
                                active={sortField === 'health_score'}
                                direction={sortField === 'health_score' ? sortOrder : 'asc'}
                                onClick={() => handleSort('health_score')}
                            >
                                Health Score
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>
                            <TableSortLabel
                                active={sortField === 'value_borrowed'}
                                direction={sortField === 'value_borrowed' ? sortOrder : 'desc'}
                                onClick={() => handleSort('value_borrowed')}
                            >
                                Value Borrowed (USD)
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>
                            <Box display="flex" alignItems="center">
                                Borrow Vault
                                <Select
                                    value={vaultFilter}
                                    onChange={handleVaultFilterChange}
                                    displayEmpty
                                    size="small"
                                    sx={{ marginLeft: 1, minWidth: 120 }}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {uniqueVaultSymbols.map((symbol) => (
                                        <MenuItem key={symbol} value={symbol}>{symbol}</MenuItem>
                                    ))}
                                </Select>
                            </Box>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {filteredAccounts.map((account) => (
                        <TableRow key={account.account_address}>
                            <TableCell>
                                <Link 
                                    href={`${process.env.REACT_APP_EULER_URL}/account/${account.sub_account}?spy=${account.address}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                >
                                    {account.account_address}
                                </Link>
                            </TableCell>
                            <TableCell>{formatHealthScore(account.health_score)}</TableCell>
                            <TableCell>{formatValueBorrowed(account.value_borrowed)}</TableCell>
                            <TableCell>{account.vault_symbol}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default AccountList;