import { useEffect, useState, type Key } from 'react';
import { Table, Tag, Space } from 'antd';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface VerificationRecord {
  _id: string;
  barcodeScanned: string;
  status: 'genuine' | 'counterfeit';
  verifiedAt: string;
  product: { _id: string; name: string; barcode: string } | null;
  user: { _id: string; name: string; email: string } | null;
}

const VerificationHistory = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const { data } = await api.get<VerificationRecord[]>('/verify/history');
        setRecords(data);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const columns = [
    {
      title: 'Barcode',
      dataIndex: 'barcodeScanned',
      key: 'barcodeScanned',
    },
    {
      title: 'Product',
      key: 'product',
      render: (_: unknown, record: VerificationRecord) => record.product?.name || <span className="text-muted">Unknown</span>,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, record: VerificationRecord) =>
        record.status === 'genuine' ? (
          <Tag icon={<CheckCircleFilled />} color="success">Genuine</Tag>
        ) : (
          <Tag icon={<CloseCircleFilled />} color="error">Counterfeit</Tag>
        ),
      filters: [
        { text: 'Genuine', value: 'genuine' },
        { text: 'Counterfeit', value: 'counterfeit' },
      ],
      onFilter: (value: boolean | Key, record: VerificationRecord) => record.status === value,
    },
    ...(user?.role === 'admin'
      ? [
          {
            title: 'Verified By',
            key: 'user',
            render: (_: unknown, record: VerificationRecord) => (
              <Space direction="vertical" size={0}>
                <span>{record.user?.name || 'Unknown'}</span>
                <span className="text-muted" style={{ fontSize: 12 }}>{record.user?.email}</span>
              </Space>
            ),
          },
        ]
      : []),
    {
      title: 'Date & Time',
      dataIndex: 'verifiedAt',
      key: 'verifiedAt',
      render: (value: string) => dayjs(value).format('DD MMM YYYY, hh:mm A'),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Verification History</h2>
          <div className="page-subtitle">
            {user?.role === 'admin' ? 'All verification attempts across the system' : 'Your recent verification attempts'}
          </div>
        </div>
      </div>
      <div className="content-card">
        <Table rowKey="_id" columns={columns} dataSource={records} loading={loading} scroll={{ x: true }} pagination={{ pageSize: 10 }} />
      </div>
    </div>
  );
};

export default VerificationHistory;
