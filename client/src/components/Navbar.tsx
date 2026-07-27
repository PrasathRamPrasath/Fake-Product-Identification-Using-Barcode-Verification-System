import { Layout, Button, Avatar, Dropdown, type MenuProps } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Header } = Layout;

interface NavbarProps {
  collapsed: boolean;
  onToggle: () => void;
  title: string;
}

const Navbar = ({ collapsed, onToggle, title }: NavbarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const items: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'My Profile',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <Header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fff',
        borderBottom: '1px solid #e6e8f0',
        padding: '0 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={onToggle} />
        <h2 style={{ margin: 0 }}>{title}</h2>
      </div>
      <Dropdown menu={{ items }} trigger={['click']}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Avatar style={{ backgroundColor: '#4f46e5' }} icon={<UserOutlined />} />
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>
      </Dropdown>
    </Header>
  );
};

export default Navbar;
