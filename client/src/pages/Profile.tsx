import { useState } from 'react';
import { Row, Col, Form, Input, Button, message, Avatar, Tag } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface ProfileFormValues {
  name: string;
  email: string;
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Profile = () => {
  const { user } = useAuth();
  const [profileForm] = Form.useForm<ProfileFormValues>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileUpdate = async (values: ProfileFormValues) => {
    setSavingProfile(true);
    try {
      await api.put('/users/profile', values);
      message.success('Profile updated successfully');
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Update failed';
      message.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (values: PasswordFormValues) => {
    setSavingPassword(true);
    try {
      await api.put('/users/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success('Password updated successfully');
      passwordForm.resetFields();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Update failed';
      message.error(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>My Profile</h2>
          <div className="page-subtitle">Manage your account details and security</div>
        </div>
      </div>

      <div className="content-card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Avatar size={64} style={{ backgroundColor: '#4f46e5' }} icon={<UserOutlined />} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 18 }}>{user?.name}</div>
          <div className="text-muted">{user?.email}</div>
          <Tag color="purple" style={{ marginTop: 6, textTransform: 'capitalize' }}>{user?.role}</Tag>
        </div>
      </div>

      <Row gutter={24}>
        <Col xs={24} md={12} style={{ marginBottom: 16 }}>
          <div className="content-card">
            <h3 style={{ marginBottom: 16 }}>Update Profile</h3>
            <Form
              form={profileForm}
              layout="vertical"
              initialValues={{ name: user?.name, email: user?.email }}
              onFinish={handleProfileUpdate}
            >
              <Form.Item name="name" label="Full name" rules={[{ required: true, message: 'Required' }]}>
                <Input prefix={<UserOutlined />} />
              </Form.Item>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ required: true, message: 'Required' }, { type: 'email', message: 'Enter a valid email' }]}
              >
                <Input prefix={<MailOutlined />} />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={savingProfile}>
                Save Changes
              </Button>
            </Form>
          </div>
        </Col>

        <Col xs={24} md={12} style={{ marginBottom: 16 }}>
          <div className="content-card">
            <h3 style={{ marginBottom: 16 }}>Change Password</h3>
            <Form form={passwordForm} layout="vertical" onFinish={handlePasswordChange}>
              <Form.Item
                name="currentPassword"
                label="Current password"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>
              <Form.Item
                name="newPassword"
                label="New password"
                rules={[{ required: true, message: 'Required' }, { min: 6, message: 'At least 6 characters' }]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="Confirm new password"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Required' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={savingPassword}>
                Update Password
              </Button>
            </Form>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
