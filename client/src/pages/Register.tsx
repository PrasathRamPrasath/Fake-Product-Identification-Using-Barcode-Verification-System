import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Alert, Segmented } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, SafetyCertificateOutlined, KeyOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import heroImg from '../assets/hero.png';
import '../styles/auth.css';

interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  adminSecret?: string;
}

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [role, setRole] = useState<'user' | 'admin'>('user');

  const onFinish = async (values: RegisterFormValues) => {
    setError('');
    setSubmitting(true);
    try {
      await register({ ...values, role });
      navigate('/verify');
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Unable to create account. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-branding">
        <img src={heroImg} alt="" />
        <h1>VeriTag</h1>
        <p>Join VeriTag to verify products and, for manufacturers, manage your product catalog and barcodes.</p>
      </div>
      <div className="auth-form-side">
        <div className="auth-card">
          <SafetyCertificateOutlined style={{ fontSize: 28, color: '#4f46e5', marginBottom: 8 }} />
          <h2>Create an account</h2>
          <p className="auth-subtitle">Start verifying products in minutes</p>

          {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

          <Segmented
            block
            value={role}
            onChange={(value) => setRole(value as 'user' | 'admin')}
            options={[
              { label: 'Customer', value: 'user' },
              { label: 'Admin / Manufacturer', value: 'admin' },
            ]}
            style={{ marginBottom: 20 }}
          />

          <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item name="name" label="Full name" rules={[{ required: true, message: 'Please enter your name' }]}>
              <Input prefix={<UserOutlined />} placeholder="Jane Doe" size="large" />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, message: 'Please enter your email' }, { type: 'email', message: 'Enter a valid email' }]}
            >
              <Input prefix={<MailOutlined />} placeholder="you@example.com" size="large" />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter a password' }, { min: 6, message: 'At least 6 characters' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="At least 6 characters" size="large" />
            </Form.Item>
            {role === 'admin' && (
              <Form.Item
                name="adminSecret"
                label="Admin registration code"
                rules={[{ required: true, message: 'Enter the admin registration code' }]}
              >
                <Input.Password prefix={<KeyOutlined />} placeholder="Provided by your organization" size="large" />
              </Form.Item>
            )}
            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large" loading={submitting}>
                Create Account
              </Button>
            </Form.Item>
          </Form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
