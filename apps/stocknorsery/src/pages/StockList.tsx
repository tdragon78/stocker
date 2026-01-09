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

// 초기 데이터 삭제 (빈 배열)
const initialData: StockDataType[] = [];

const StockList: React.FC = () => {
    const [data, setData] = useState<StockDataType[]>(initialData);
    const [options, setOptions] = useState<{ value: string; label: string; stock: SearchResult }[]>([]);
    const [searchValue, setSearchValue] = useState('');

    // 자동 갱신 (3초 간격)
    const dataRef = React.useRef(data);

    React.useEffect(() => {
        dataRef.current = data;
    }, [data]);

    React.useEffect(() => {
        const fetchPrices = async () => {
            const codes = dataRef.current.map(d => d.code);
            if (codes.length === 0) return;

            try {
                const results = await api.getStocksPrices(codes);

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
                console.error('가격 갱신 실패:', error);
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
            console.error('검색 실패:', error);
        }
    };

    const handleSelect = (_value: string, option: any) => {
        const selectedStock = option.stock as SearchResult;

        if (data.find(d => d.code === selectedStock.code)) {
            message.warning('이미 목록에 있는 종목입니다.');
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
            saved: false,
        };

        setData(prev => [newStock, ...prev]);
        setSearchValue('');
        message.success(`${selectedStock.name} 종목이 추가되었습니다.`);
    };

    const toggleSaved = (key: string) => {
        setData(prev => prev.map(item =>
            item.key === key ? { ...item, saved: !item.saved } : item
        ));
    };

    const columns: ColumnsType<StockDataType> = [
        {
            title: '종목명',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <span style={{ fontWeight: 'bold' }}>{text}</span>,
        },
        {
            title: '종목코드',
            dataIndex: 'code',
            key: 'code',
            render: (code) => <Tag color="blue">{code}</Tag>,
        },
        {
            title: '현재가',
            dataIndex: 'price',
            key: 'price',
            align: 'right',
            render: (price) => price === 0 ? <Tag color="warning">데이터 없음</Tag> : `${price.toLocaleString()}원`,
        },
        {
            title: '변동량',
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
            title: '저장',
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
                <Title level={4} style={{ margin: 0 }}>나의 관심 종목</Title>
                <div style={{ width: 300 }}>
                    <AutoComplete
                        value={searchValue}
                        options={options}
                        style={{ width: '100%' }}
                        onSelect={handleSelect}
                        onSearch={handleSearch}
                        placeholder="종목명 또는 코드 검색 (예: 삼성전자)"
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
