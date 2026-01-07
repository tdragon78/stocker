import React from 'react';
import { Layout, Typography } from 'antd';
import StockList from './pages/StockList';
import './App.css';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  return (
    <Layout className="layout" style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <Title level={3} style={{ color: 'white', margin: 0 }}>
          StockNorsery
        </Title>
      </Header>
      <Content style={{ padding: '0' }}>
        <div className="site-layout-content">
          <StockList />
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        StockNorsery ©{new Date().getFullYear()} Created by Antigravity
      </Footer>
    </Layout>
  );
};

export default App;
