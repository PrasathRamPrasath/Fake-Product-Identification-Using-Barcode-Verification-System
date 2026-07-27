import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Segmented } from 'antd';
import { InboxOutlined, BarcodeOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../utils/api';
import ReportChart, { type ReportPoint } from '../components/ReportChart';

interface Summary {
  totalProducts: number;
  totalVerifications: number;
  genuineCount: number;
  counterfeitCount: number;
  totalUsers: number;
  recentActivity: Array<{
    _id: string;
    barcodeScanned: string;
    status: 'genuine' | 'counterfeit';
    verifiedAt: string;
    product: { name: string; barcode: string } | null;
    user: { name: string; email: string } | null;
  }>;
}

const Dashboard = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [report, setReport] = useState<ReportPoint[]>([]);
  const [range, setRange] = useState<number>(14);

  useEffect(() => {
    api.get<Summary>('/dashboard/summary').then(({ data }) => setSummary(data));
  }, []);

  useEffect(() => {
    api.get<ReportPoint[]>('/dashboard/reports', { params: { range } }).then(({ data }) => setReport(data));
  }, [range]);

  const stats = [
    { title: 'Total Products', value: summary?.totalProducts ?? 0, icon: <InboxOutlined />, color: '#4f46e5' },
    { title: 'Total Verifications', value: summary?.totalVerifications ?? 0, icon: <BarcodeOutlined />, color: '#0ea5e9' },
    { title: 'Genuine Verified', value: summary?.genuineCount ?? 0, icon: <CheckCircleOutlined />, color: '#0ca30c' },
    { title: 'Invalid Barcode Attempts', value: summary?.counterfeitCount ?? 0, icon: <CloseCircleOutlined />, color: '#d03b3b' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <div className="page-subtitle">Overview of product verifications and system activity</div>
        </div>
      </div>

      <Row gutter={16}>
        {stats.map((s) => (
          <Col xs={24} sm={12} lg={6} key={s.title} style={{ marginBottom: 16 }}>
            <Card className="content-card" styles={{ body: { padding: 20 } }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: `${s.color}1a`,
                    color: s.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                  }}
                >
                  {s.icon}
                </div>
                <Statistic title={s.title} value={s.value} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={16} style={{ marginBottom: 16 }}>
          <div className="content-card">
            <div className="page-header" style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Verification Trend</h3>
              <Segmented
                value={range}
                onChange={(value) => setRange(value as number)}
                options={[
                  { label: '7d', value: 7 },
                  { label: '14d', value: 14 },
                  { label: '30d', value: 30 },
                ]}
              />
            </div>
            <ReportChart data={report} />
          </div>
        </Col>
        <Col xs={24} lg={8} style={{ marginBottom: 16 }}>
          <div className="content-card" style={{ height: '100%' }}>
            <h3 style={{ marginBottom: 12 }}>Recent Activity</h3>
            <List
              dataSource={summary?.recentActivity ?? []}
              renderItem={(item) => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600 }}>{item.product?.name || 'Unknown product'}</span>
                      {item.status === 'genuine' ? (
                        <Tag color="success">Genuine</Tag>
                      ) : (
                        <Tag color="error">Counterfeit</Tag>
                      )}
                    </div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      {item.barcodeScanned} · {dayjs(item.verifiedAt).format('DD MMM, hh:mm A')}
                    </div>
                  </div>
                </List.Item>
              )}
              locale={{ emptyText: 'No verification activity yet' }}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
