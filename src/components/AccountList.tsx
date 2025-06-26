import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Link,
  TableSortLabel,
  SelectChangeEvent,
  Box,
  Tabs,
  Tab,
  FormControl,
  TextField,
  Autocomplete,
} from "@mui/material";
import { formatUnits } from "ethers";
import RiskMetrics from "./RiskMetrics";

interface Account {
  address: string;
  account_address: string;
  sub_account: string;
  health_score: number;
  value_borrowed: string;
  vault_name: string;
  vault_symbol: string;
  networkChainId?: string;
}

type SortField = "health_score" | "value_borrowed";
type SortOrder = "asc" | "desc";

interface AccountListProps {}

const AccountList: React.FC<AccountListProps> = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("health_score");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [vaultFilter, setVaultFilter] = useState<string>("");
  const [tabValue, setTabValue] = useState(0);
  const [networkFilter, setNetworkFilter] = useState<string>("");
  const [assetFilter, setAssetFilter] = useState<string>("");
  const [minHealth, setMinHealth] = useState<string>("");
  const [maxHealth, setMaxHealth] = useState<string>("");
  const [minValue, setMinValue] = useState<string>("");
  const [maxValue, setMaxValue] = useState<string>("");

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch from all networks in parallel
        const networks = [
          {
            id: "1",
            url: `${process.env.REACT_APP_BACKEND_URL}/liquidation/allPositions`,
          },
          {
            id: "8453",
            url: `${process.env.REACT_APP_MULTI_BACKEND_URL}/liquidation/allPositions?chainId=8453`,
          },
          {
            id: "1923",
            url: `${process.env.REACT_APP_MULTI_BACKEND_URL}/liquidation/allPositions?chainId=1923`,
          },
          {
            id: "146",
            url: `${process.env.REACT_APP_MULTI_BACKEND_URL}/liquidation/allPositions?chainId=146`,
          },
          {
            id: "60808",
            url: `${process.env.REACT_APP_MULTI_BACKEND_URL}/liquidation/allPositions?chainId=60808`,
          },
          {
            id: "80094",
            url: `${process.env.REACT_APP_MULTI_BACKEND_URL}/liquidation/allPositions?chainId=80094`,
          },
          {
            id: "43114",
            url: `${process.env.REACT_APP_MULTI_BACKEND_URL}/liquidation/allPositions?chainId=43114`,
          },
          {
            id: "56",
            url: `${process.env.REACT_APP_MULTI_BACKEND_URL}/liquidation/allPositions?chainId=56`,
          },
          {
            id: "130",
            url: `${process.env.REACT_APP_MULTI_BACKEND_URL}/liquidation/allPositions?chainId=130`,
          },
          {
            id: "42161",
            url: `${process.env.REACT_APP_MULTI_BACKEND_URL}/liquidation/allPositions?chainId=42161`,
          }
        ];

        const results = await Promise.allSettled(
          networks.map((network) =>
            axios.get(network.url).then((response) => ({
              chainId: network.id,
              data: Array.isArray(response.data)
                ? response.data
                : JSON.parse(response.data),
            }))
          )
        );

        const allAccounts = results
          .filter(
            (
              result
            ): result is PromiseFulfilledResult<{
              chainId: string;
              data: Account[];
            }> => result.status === "fulfilled"
          )
          .flatMap((result) =>
            result.value.data.map((account) => ({
              ...account,
              networkChainId: result.value.chainId,
            }))
          );

        setAccounts(allAccounts);
      } catch (error) {
        console.error("Failed to fetch accounts:", error);
        setError(
          `Failed to fetch accounts: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
    const interval = setInterval(fetchAccounts, 60000);

    return () => clearInterval(interval);
  }, []);

  const formatValueBorrowed = (value: string): string => {
    try {
      const bigNumberValue = BigInt(value);
      const valueInEther = parseFloat(formatUnits(bigNumberValue, 18));
      return valueInEther.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch (error) {
      console.error("Error formatting value:", value, error);
      return "Error";
    }
  };

  const getAssetFromSymbol = (symbol: string): string => {
    const match = symbol.match(/e(.+?)-/);
    return match ? match[1] : symbol;
  };

  const { totalValueBorrowed, accountsWithBorrow, assetTotals } = useMemo(() => {
    let total = BigInt(0);
    let count = 0;
    const assetTotals: { [key: string]: bigint } = {};

    // Filter accounts by network before calculating totals
    const filteredAccounts = accounts.filter(account => 
      networkFilter === "" || account.networkChainId === networkFilter
    );

    filteredAccounts.forEach((account) => {
      const value = BigInt(account.value_borrowed);
      if (value > BigInt(0)) {
        total += value;
        count++;

        const asset = getAssetFromSymbol(account.vault_symbol);
        assetTotals[asset] = (assetTotals[asset] || BigInt(0)) + value;
      }
    });

    return {
      totalValueBorrowed: formatValueBorrowed(total.toString()),
      accountsWithBorrow: count,
      assetTotals: Object.fromEntries(
        Object.entries(assetTotals).map(([asset, value]) => [
          asset,
          formatValueBorrowed(value.toString()),
        ])
      ),
    };
  }, [accounts, networkFilter]);

  const formatHealthScore = (score: number): string => {
    return score.toFixed(4);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder(field === "value_borrowed" ? "desc" : "asc");
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleNetworkFilterChange = (event: SelectChangeEvent<string>) => {
    setNetworkFilter(event.target.value);
  };

  const handleMinHealthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMinHealth(event.target.value);
  };

  const handleMaxHealthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMaxHealth(event.target.value);
  };

  const handleMinValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMinValue(event.target.value);
  };

  const handleMaxValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMaxValue(event.target.value);
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const sortedAccounts = [...accounts].sort((a, b) => {
    if (sortField === "health_score") {
      return (a.health_score - b.health_score) * (sortOrder === "asc" ? 1 : -1);
    } else {
      const aValue = BigInt(a.value_borrowed);
      const bValue = BigInt(b.value_borrowed);
      return (
        (aValue > bValue ? -1 : aValue < bValue ? 1 : 0) *
        (sortOrder === "asc" ? -1 : 1)
      );
    }
  });

  const filteredAccounts = sortedAccounts.filter((account) => {
    const matchesAsset = assetFilter === "" || getAssetFromSymbol(account.vault_symbol) === assetFilter;
    const matchesNetwork = networkFilter === "" || account.networkChainId === networkFilter;
    const matchesVault = vaultFilter === "" || account.vault_symbol === vaultFilter;
    
    const healthScore = account.health_score;
    const matchesMinHealth = minHealth === "" || healthScore >= parseFloat(minHealth);
    const matchesMaxHealth = maxHealth === "" || healthScore <= parseFloat(maxHealth);
    
    const valueBorrowed = parseFloat(formatUnits(BigInt(account.value_borrowed), 18));
    const matchesMinValue = minValue === "" || valueBorrowed >= parseFloat(minValue);
    const matchesMaxValue = maxValue === "" || valueBorrowed <= parseFloat(maxValue);

    return matchesAsset && matchesNetwork && matchesVault && matchesMinHealth && matchesMaxHealth && matchesMinValue && matchesMaxValue;
  });

  const uniqueVaultSymbols = Array.from(
    new Set(accounts.map((account) => account.vault_symbol))
  ).sort();

  const uniqueNetworks = Array.from(
    new Set(accounts.map((account) => account.networkChainId))
  ).filter((networkId): networkId is string => networkId !== undefined);

  const uniqueAssets = Array.from(
    new Set(accounts.map((account) => getAssetFromSymbol(account.vault_symbol)))
  ).sort();

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
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Account Health" />
          <Tab label="Protocol Risk Metrics" />
        </Tabs>
      </Box>
      <Box sx={{ mt: 0 }}>
        {tabValue === 0 ? (
          <>
            <Box 
              sx={{ 
                display: 'flex', 
                gap: 2, 
                mb: 2, 
                mt: 2,
                flexWrap: 'wrap',
                alignItems: 'flex-end'
              }}
            >
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Typography variant="caption" sx={{ mb: 0.5 }}>Network</Typography>
                <Autocomplete
                  size="small"
                  value={networkFilter}
                  onChange={(_, newValue) => setNetworkFilter(newValue || "")}
                  options={["", ...uniqueNetworks]}
                  getOptionLabel={(option) => 
                    option === "" ? "All" :
                    option === "1" ? "Mainnet" :
                    option === "8453" ? "Base" :
                    option === "1923" ? "Swell" :
                    option === "146" ? "Sonic" :
                    option === "60808" ? "BOB" : 
                    option === "80094" ? "Berachain" :
                    option === "43114" ? "Avalanche" :
                    option === "56" ? "BNB" :
                    option === "130" ? "Unichain" :
                    option === "42161" ? "Arbitrum" : "Unknown"
                  }
                  renderInput={(params) => (
                    <TextField {...params} />
                  )}
                  sx={{ width: 200 }}
                />
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Typography variant="caption" sx={{ mb: 0.5 }}>Borrow Asset</Typography>
                <Autocomplete
                  size="small"
                  value={assetFilter}
                  onChange={(_, newValue) => setAssetFilter(newValue || "")}
                  options={["", ...uniqueAssets]}
                  getOptionLabel={(option) => option || "All"}
                  renderInput={(params) => (
                    <TextField {...params} />
                  )}
                  sx={{ width: 200 }}
                />
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Typography variant="caption" sx={{ mb: 0.5 }}>Borrow Vault</Typography>
                <Autocomplete
                  size="small"
                  value={vaultFilter}
                  onChange={(_, newValue) => setVaultFilter(newValue || "")}
                  options={["", ...uniqueVaultSymbols]}
                  getOptionLabel={(option) => option || "All"}
                  renderInput={(params) => (
                    <TextField {...params} />
                  )}
                  sx={{ width: 200 }}
                />
              </FormControl>

              <FormControl size="small" sx={{ width: 100 }}>
                <Typography variant="caption" sx={{ mb: 0.5 }}>Min Health</Typography>
                <TextField
                  size="small"
                  value={minHealth}
                  onChange={handleMinHealthChange}
                  type="number"
                  inputProps={{ step: "0.01" }}
                />
              </FormControl>

              <FormControl size="small" sx={{ width: 100 }}>
                <Typography variant="caption" sx={{ mb: 0.5 }}>Max Health</Typography>
                <TextField
                  size="small"
                  value={maxHealth}
                  onChange={handleMaxHealthChange}
                  type="number"
                  inputProps={{ step: "0.01" }}
                />
              </FormControl>

              <FormControl size="small" sx={{ width: 100 }}>
                <Typography variant="caption" sx={{ mb: 0.5 }}>Min Value</Typography>
                <TextField
                  size="small"
                  value={minValue}
                  onChange={handleMinValueChange}
                  type="number"
                  inputProps={{ step: "0.01" }}
                />
              </FormControl>

              <FormControl size="small" sx={{ width: 100 }}>
                <Typography variant="caption" sx={{ mb: 0.5 }}>Max Value</Typography>
                <TextField
                  size="small"
                  value={maxValue}
                  onChange={handleMaxValueChange}
                  type="number"
                  inputProps={{ step: "0.01" }}
                />
              </FormControl>
            </Box>

            <TableContainer component={Paper} elevation={2}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Address</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortField === "health_score"}
                        direction={sortField === "health_score" ? sortOrder : "asc"}
                        onClick={() => handleSort("health_score")}
                      >
                        Health Score
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortField === "value_borrowed"}
                        direction={sortField === "value_borrowed" ? sortOrder : "desc"}
                        onClick={() => handleSort("value_borrowed")}
                      >
                        Value Borrowed (USD)
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Asset</TableCell>
                    <TableCell>Vault</TableCell>
                    <TableCell>Network</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAccounts.map((account) => (
                    <TableRow
                      key={`${account.networkChainId}-${account.account_address}`}
                    >
                      <TableCell>
                        <Link
                          href={`${process.env.REACT_APP_EULER_URL}/account/${account.sub_account}?spy=${account.address}&chainId=${account.networkChainId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {formatAddress(account.account_address)}
                        </Link>
                      </TableCell>
                      <TableCell>{formatHealthScore(account.health_score)}</TableCell>
                      <TableCell>
                        {formatValueBorrowed(account.value_borrowed)}
                      </TableCell>
                      <TableCell>{getAssetFromSymbol(account.vault_symbol)}</TableCell>
                      <TableCell>{account.vault_symbol}</TableCell>
                      <TableCell>
                        {account.networkChainId === "1"
                          ? "Mainnet"
                          : account.networkChainId === "8453"
                          ? "Base"
                          : account.networkChainId === "1923"
                          ? "Swell"
                          : account.networkChainId === "146"
                          ? "Sonic"
                          : account.networkChainId === "60808"
                          ? "BOB"
                          : account.networkChainId === "80094"
                          ? "Berachain"
                          : account.networkChainId === "43114"
                          ? "Avalanche"
                          : account.networkChainId === "56"
                          ? "BNB"
                          : account.networkChainId === "130"
                          ? "Unichain"
                          : account.networkChainId === "42161"
                          ? "Arbitrum"
                          : "Unknown"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <RiskMetrics
            totalValueBorrowed={totalValueBorrowed}
            accountsWithBorrow={accountsWithBorrow}
            assetTotals={assetTotals}
            networkFilter={networkFilter}
            onNetworkFilterChange={handleNetworkFilterChange}
            uniqueNetworks={uniqueNetworks}
          />
        )}
      </Box>
    </Box>
  );
};

export default AccountList;
