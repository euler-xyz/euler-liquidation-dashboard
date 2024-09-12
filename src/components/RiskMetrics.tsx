import React from 'react';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

interface RiskMetricsProps {
    totalValueBorrowed: string;
    accountsWithBorrow: number;
    assetTotals: { [key: string]: string };
}

const RiskMetrics: React.FC<RiskMetricsProps> = ({ totalValueBorrowed, accountsWithBorrow, assetTotals }) => {
    return (
        <>
            <TableContainer component={Paper} elevation={2} sx={{ mb: 4 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell colSpan={2}>
                                <Typography variant="h6">Protocol Metrics</Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell>Total Value Borrowed</TableCell>
                            <TableCell>{totalValueBorrowed}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Number of Accounts</TableCell>
                            <TableCell>{accountsWithBorrow}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell colSpan={2}>
                                <Typography variant="h6">Borrow Metrics</Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.entries(assetTotals).map(([asset, value]) => (
                            <TableRow key={asset}>
                                <TableCell>{asset}</TableCell>
                                <TableCell>{value}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
};

export default RiskMetrics;