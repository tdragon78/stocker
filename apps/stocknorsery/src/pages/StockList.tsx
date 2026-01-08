import React, { useState } from 'react';
import { Table, Tag, Space, Card, Typography, AutoComplete, Input, message, Checkbox } from 'antd';
import { api } from '../api';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

interface StockDataType {
    key: string;
    name: string;
    code: string;
    price: number;
    change: number;
    changeRate: number;
    saved: boolean;
}

interface SearchResult {
    code: string;
    name: string;
}

// Mock Data
const initialData: StockDataType[] = [
    {
        key: '1',
        name: 'Samsung Electronics',
        code: '005930',
        price: 72500,
        change: 500,
        changeRate: 0.69,
        saved: true,
    },
    {
        key: '2',
        name: 'SK Hynix',
        code: '000660',
        price: 132000,
        change: -1500,
        changeRate: -1.12,
        saved: false,
    },
];

const StockList: React.FC = () => {
    const [data, setData] = useState<StockDataType[]>(initialData);
    const [options, setOptions] = useState<{ value: string; label: string; stock: SearchResult }[]>([]);
    const [searchValue, setSearchValue] = useState('');

    // Auto-refresh every 3 seconds
    // Use Ref to keep track of current codes without triggering effect re-run on price changes
    const dataRef = React.useRef(data);

    React.useEffect(() => {
        dataRef.current = data;
    }, [data]);

    // Auto-refresh every 3 seconds
    React.useEffect(() => {
        const fetchPrices = async () => {
            const codes = dataRef.current.map(d => d.code);
            if (codes.length === 0) return;

            try {
                const results = await api.getStocksPrices(codes);

                // Note: The logic below assumes results is an array of objects
                // and each object mimics the structure { code, success, data: { output: ... } }
                // Adjust if api.getStocksPrices returns differently (it currently returns results array directly).

                setData(currentData => currentData.map(stock => {
                    const result = results.find((r: any) => r.code === stock.code);
                    if (result && result.success && result.data && result.data.output) {
                        const output = result.data.output;
                        return {
                            ...stock,
                            price: parseInt(output.stck_prpr) || stock.price,
                            change: parseInt(output.prdy_vrss) || stock.change,
                            changeRate: parseFloat(output.prdy_ctrt) || stock.changeRate,
                        };
                    }
                    return stock;
                }));
            } catch (error) {
                console.error('Failed to fetch prices:', error);
            }
        };

        const intervalId = setInterval(fetchPrices, 3000);
        return () => clearInterval(intervalId);
    }, []);

    const handleSearch = async (value: string) => {
        setSearchValue(value);
        if (!value) {
            setOptions([]);
            return;
        }

        try {
            const results: SearchResult[] = await api.searchStocks(value);
            setOptions(results.map(stock => ({
                value: stock.name,
                label: `${stock.name} (${stock.code})`,
                stock,
            })));
        } catch (error) {
            console.error('Search failed:', error);
        }
    };

    const handleSelect = (_value: string, option: any) => {
        const selectedStock = option.stock as SearchResult;

        if (data.find(d => d.code === selectedStock.code)) {
            message.warning('This stock is already in the list.');
            setSearchValue('');
            return;
        }

        const newStock: StockDataType = {
            key: Date.now().toString(),
            name: selectedStock.name,
            code: selectedStock.code,
            price: 0,
            change: 0,
            changeRate: 0,
            saved: false, // Default to false when adding
        };

        setData(prev => [newStock, ...prev]);
        setSearchValue('');
        message.success(`Added ${selectedStock.name}`);
    };

    const toggleSaved = (key: string) => {
        setData(prev => prev.map(item =>
            item.key === key ? { ...item, saved: !item.saved } : item
        ));
    };

    const columns: ColumnsType<StockDataType> = [
        {
            title: 'Stock Name',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <span style={{ fontWeight: 'bold' }}>{text}</span>,
        },
        {
            title: 'Code',
            dataIndex: 'code',
            key: 'code',
            render: (code) => <Tag color="blue">{code}</Tag>,
        },
        {
            title: 'Current Price',
            dataIndex: 'price',
            key: 'price',
            align: 'right',
            render: (price) => price === 0 ? <Tag color="warning">No Data</Tag> : `${price.toLocaleString()} KRW`,
        },
        {
            title: 'Change',
            key: 'change',
            align: 'right',
            render: (_, record) => {
                if (record.price === 0) return '-';

                let color = 'black';
                let prefix = '';
                if (record.change > 0) {
                    color = 'red';
                    prefix = '▲';
                } else if (record.change < 0) {
                    color = 'blue';
                    prefix = '▼';
                }

                return (
                    <Space>
                        <span style={{ color }}>{prefix} {Math.abs(record.change).toLocaleString()}</span>
                        <span style={{ color }}>({record.changeRate}%)</span>
                    </Space>
                )
            },
        },
        {
            title: 'Saved',
            dataIndex: 'saved',
            key: 'saved',
            render: (saved, record) => (
                <Checkbox
                    checked={saved}
                    onChange={() => toggleSaved(record.key)}
                    onClick={(e) => e.stopPropagation()}
                />
            ),
            width: 80,
            align: 'center',
        },
    ];

    return (
        <Card bordered={false} style={{ height: '100%', borderRadius: 0 }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0 }}>My Watchlist</Title>
                <div style={{ width: 300 }}>
                    <AutoComplete
                        value={searchValue}
                        options={options}
                        style={{ width: '100%' }}
                        onSelect={handleSelect}
                        onSearch={handleSearch}
                        placeholder="Search Stock (e.g. Samsung)"
                    >
                        <Input.Search size="middle" enterButton />
                    </AutoComplete>
                </div>
            </div>
            <Table columns={columns} dataSource={data} pagination={false} />
        </Card>
    );
};

export default StockList;
