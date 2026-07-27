import { useState, type ReactNode } from 'react';
import { Layout, Menu } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DashboardOutlined,
  InboxOutlined,
  BarcodeOutlined,
  HistoryOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';

const { Sider, Content } = Layout;

interface AppLayoutProps {
  children: ReactNode;
}

const adminMenuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/products', icon: <InboxOutlined />, label: 'Products' },
  { key: '/verify', icon: <BarcodeOutlined />, label: 'Verify Barcode' },
  { key: '/history', icon: <HistoryOutlined />, label: 'Verification History' },
  { key: '/profile', icon: <UserOutlined />, label: 'Profile' },
];

const userMenuItems = [
  { key: '/verify', icon: <BarcodeOutlined />, label: 'Verify Barcode' },
  { key: '/history', icon: <HistoryOutlined />, label: 'My History' },
  { key: '/profile', icon: <UserOutlined />, label: 'Profile' },
];

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/products': 'Product Management',
  '/verify': 'Verify Barcode',
  '/history': 'Verification History',
  '/profile': 'My Profile',
};

const AppLayout = ({ children }: AppLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const menuItems = user?.role === 'admin' ? adminMenuItems : userMenuItems;
  const title = pageTitles[location.pathname] || 'VeriTag';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={230}
        style={{
          background: 'linear-gradient(180deg,#1e1b4b,#2d2a6e)',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            height: 56,
            padding: collapsed ? '0' : '0 20px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            color: '#fff',
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          <SafetyCertificateOutlined style={{ fontSize: 22, color: '#a5b4fc' }} />
          {!collapsed && <span>VeriTag</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', borderInlineEnd: 'none' }}
        />
      </Sider>
      <Layout>
        <Navbar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} title={title} />
        <Content style={{ padding: 24, background: '#f8f9ff' }}>{children}</Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
