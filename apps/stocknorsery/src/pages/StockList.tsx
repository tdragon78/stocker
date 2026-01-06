import React, { useState } from 'react';
import { Table, Tag, Space, Card, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

interface StockDataType {
    key: string;
    name: string;
    code: string;
    price: number;
    change: number;
    changeRate: number;
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
    },
    {
        key: '2',
        name: 'SK Hynix',
        code: '000660',
        price: 132000,
        change: -1500,
        changeRate: -1.12,
    },
    {
        key: '3',
        name: 'NAVER',
        code: '035420',
        price: 215000,
        change: 0,
        changeRate: 0.00,
    },
    {
        key: '4',
        name: 'Kakao',
        code: '035720',
        price: 54300,
        change: 200,
        changeRate: 0.37,
    },
    {
        key: '5',
        name: 'Hyundai Motor',
        code: '005380',
        price: 187400,
        change: 1200,
        changeRate: 0.64,
    },
];

const StockList: React.FC = () => {
    const [data] = useState<StockDataType[]>(initialData);

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
            render: (price) => `${price.toLocaleString()} KRW`,
        },
        {
            title: 'Change',
            key: 'change',
            align: 'right',
            render: (_, record) => {
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
    ];

    return (
        <Card>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0 }}>Real-time Stock Quotes (Mock)</Title>
            </div>
            <Table columns={columns} dataSource={data} pagination={false} />
        </Card>
    );
};

export default StockList;
