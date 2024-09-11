import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Paper, Typography, Button, CircularProgress } from '@mui/material';

interface HistoryPlotProps {
    address: string;
    onClose: () => void;
}

interface HistoryData {
    blockNumber: number;
    points: number;
}

const HistoryPlot: React.FC<HistoryPlotProps> = ({ address, onClose }) => {
    const [history, setHistory] = useState<HistoryData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await axios.get(`${process.env.REACT_APP_POINTS_URL}/xp/depositor/history`, {
                    params: { address }
                });
                const formattedHistory = response.data.history.map((item: [number, number]) => ({
                    blockNumber: item[0],
                    points: item[1]
                }));
                setHistory(formattedHistory);
            } catch (error) {
                console.error('Failed to fetch history:', error);
                setError(`Failed to fetch history: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [address]);

    const { minBlock, maxBlock } = useMemo(() => {
        if (history.length === 0) return { minBlock: 0, maxBlock: 0 };
        const blocks = history.map(item => item.blockNumber);
        return {
            minBlock: Math.min(...blocks),
            maxBlock: Math.max(...blocks)
        };
    }, [history]);

    if (loading) {
        return <CircularProgress />;
    }

    if (error) {
        return <Typography color="error">{error}</Typography>;
    }

    return (
        <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
            <Typography variant="h6" gutterBottom>
                Points History for {address}
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart
                    data={history}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="blockNumber" 
                        type="number" 
                        scale="linear"
                        domain={[minBlock, maxBlock]}
                    />
                    <YAxis />
                    <Tooltip 
                        labelFormatter={(value) => `Block: ${value}`}
                        formatter={(value: number) => [value.toLocaleString(undefined, {maximumFractionDigits: 2}), "Points"]}
                    />
                    <Legend />
                    <Line 
                        type="linear" 
                        dataKey="points" 
                        stroke="#8884d8" 
                        dot={{ stroke: '#8884d8', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 8 }}
                    />
                </LineChart>
            </ResponsiveContainer>
            <Button variant="contained" onClick={onClose} style={{ marginTop: '20px' }}>
                Back to List
            </Button>
        </Paper>
    );
};

export default HistoryPlot;