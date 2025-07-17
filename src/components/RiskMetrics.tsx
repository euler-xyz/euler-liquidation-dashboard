import React, { useState } from 'react';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, FormControl, Select, MenuItem, Autocomplete, TextField } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';

interface RiskMetricsProps {
    totalValueBorrowed: string;
    accountsWithBorrow: number;
    assetTotals: { [key: string]: string };
    networkFilter: string;
    onNetworkFilterChange: (event: SelectChangeEvent<string>) => void;
    uniqueNetworks: string[];
}

const RiskMetrics: React.FC<RiskMetricsProps> = ({ totalValueBorrowed, accountsWithBorrow, assetTotals, networkFilter, onNetworkFilterChange, uniqueNetworks }) => {
    const [assetFilter, setAssetFilter] = useState<string>("");
    
    const filteredAssetTotals = Object.entries(assetTotals)
        .filter(([asset]) => !assetFilter || asset === assetFilter)
        .sort(([, a], [, b]) => {
            const aValue = parseFloat(a.replace(/[$,]/g, ''));
            const bValue = parseFloat(b.replace(/[$,]/g, ''));
            return bValue - aValue;
        });

    return (
        <>
            <Box sx={{ mb: 2, mt: 2 }}>
                <FormControl size="small" sx={{ width: 120 }}>
                    <Typography variant="caption" sx={{ mb: 0.5 }}>Network</Typography>
                    <Select
                        value={networkFilter}
                        onChange={onNetworkFilterChange}
                        displayEmpty
                        sx={{ width: 120 }}
                    >
                        <MenuItem value="">All</MenuItem>
                        {uniqueNetworks.map((networkId) => (
                            <MenuItem key={networkId} value={networkId}>
                                {networkId === "1"
                                    ? "Mainnet"
                                    : networkId === "8453"
                                    ? "Base"
                                    : networkId === "1923"
                                    ? "Swell"
                                    : networkId === "146"
                                    ? "Sonic"
                                    : networkId === "60808"
                                    ? "BOB"
                                    : networkId === "80094"
                                    ? "Berachain"
                                    : networkId === "43114"
                                    ? "Avalanche"
                                    : networkId === "56"
                                    ? "BNB"
                                    : networkId === "130"
                                    ? "Unichain"
                                    : networkId === "42161"
                                    ? "Arbitrum"
                                    : networkId === "239"
                                    ? "TAC"
                                    : "Unknown"}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <Box sx={{ maxWidth: '50%', margin: '0' }}>
                <TableContainer component={Paper} elevation={2} sx={{ mb: 4 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell colSpan={2}>
                                    <Typography variant="subtitle1">Protocol Metrics</Typography>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell>Total Value Borrowed</TableCell>
                                <TableCell align="right">{totalValueBorrowed}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Number of Accounts with Borrows</TableCell>
                                <TableCell align="right">{accountsWithBorrow}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ mb: 2 }}>
                    <FormControl size="small" sx={{ width: 120 }}>
                        <Typography variant="caption" sx={{ mb: 0.5 }}>Filter Assets</Typography>
                        <Autocomplete
                            size="small"
                            value={assetFilter}
                            onChange={(_, newValue) => setAssetFilter(newValue || "")}
                            options={["", ...Object.keys(assetTotals)]}
                            getOptionLabel={(option) => option || "All"}
                            renderInput={(params) => (
                                <TextField {...params} />
                            )}
                            sx={{ width: 120 }}
                            disableClearable
                        />
                    </FormControl>
                </Box>

                <TableContainer component={Paper} elevation={2}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell colSpan={2}>
                                    <Typography variant="subtitle1">Borrow Metrics</Typography>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredAssetTotals.map(([asset, value]) => (
                                <TableRow key={asset}>
                                    <TableCell>{asset}</TableCell>
                                    <TableCell align="right">{value}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </>
    );
};

export default RiskMetrics;