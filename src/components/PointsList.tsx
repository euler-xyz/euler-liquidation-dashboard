import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress, Link, TableSortLabel, Button } from '@mui/material';
import HistoryPlot from './HistoryPlot';

interface Account {
    address: string;
    lpXP: number;
    rank: number;
}

type SortField = 'lpXP' | 'rank';
type SortOrder = 'asc' | 'desc';

const PointsList: React.FC = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortField, setSortField] = useState<SortField>('rank');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await axios.get(`${process.env.REACT_APP_POINTS_URL}/xp/depositors`);
                setAccounts(response.data);
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

    const formatLPXP = (lpXP: number): string => {
        return lpXP.toLocaleString('en-US', { maximumFractionDigits: 2 });
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

    const sortedAccounts = [...accounts].sort((a, b) => {
        const multiplier = sortOrder === 'asc' ? 1 : -1;
        if (sortField === 'lpXP') {
            return (a.lpXP - b.lpXP) * multiplier;
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
        <TableContainer component={Paper} elevation={2}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Rank</TableCell>
                        <TableCell>Address</TableCell>
                        <TableCell>
                            <TableSortLabel
                                active={sortField === 'lpXP'}
                                direction={sortField === 'lpXP' ? sortOrder : 'asc'}
                                onClick={() => handleSort('lpXP')}
                            >
                                lpXP
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>Action</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedAccounts.map((account) => (
                        <TableRow key={account.address}>
                            <TableCell>{account.rank}</TableCell>
                            <TableCell>
                                <Link 
                                    href={`${process.env.REACT_APP_EULER_URL}/?spy=${account.address}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                >
                                    {account.address}
                                </Link>
                            </TableCell>
                            <TableCell>{formatLPXP(account.lpXP)}</TableCell>
                            <TableCell>
                                <Button 
                                    variant="contained" 
                                    onClick={() => handlePlotClick(account.address)}
                                >
                                    Plot
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default PointsList;