import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Upload,
  Popconfirm,
  message,
  Space,
  Row,
  Col,
  Tag,
  type UploadFile,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BarcodeOutlined,
  UploadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import api from '../utils/api';
import BarcodeModal from '../components/BarcodeModal';

interface Product {
  _id: string;
  name: string;
  barcode: string;
  brand: string;
  manufacturer: string;
  category: string;
  description: string;
  manufacturingDate?: string;
  expiryDate?: string;
  batchNumber: string;
  price: number;
  imageUrl: string;
  createdAt: string;
}

interface ProductFormValues {
  name: string;
  manufacturer: string;
  brand?: string;
  category?: string;
  description?: string;
  batchNumber?: string;
  price?: number;
  barcode?: string;
  manufacturingDate?: Dayjs;
  expiryDate?: Dayjs;
}

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null);
  const [form] = Form.useForm<ProductFormValues>();

  const fetchProducts = async (query = '') => {
    setLoading(true);
    try {
      const { data } = await api.get<Product[]>('/products', { params: query ? { search: query } : {} });
      setProducts(data);
    } catch {
      message.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialProducts = async () => {
      setLoading(true);
      try {
        const { data } = await api.get<Product[]>('/products');
        setProducts(data);
      } catch {
        message.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    loadInitialProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    form.resetFields();
    setFileList([]);
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue({
      name: product.name,
      manufacturer: product.manufacturer,
      brand: product.brand,
      category: product.category,
      description: product.description,
      batchNumber: product.batchNumber,
      price: product.price,
      manufacturingDate: product.manufacturingDate ? dayjs(product.manufacturingDate) : undefined,
      expiryDate: product.expiryDate ? dayjs(product.expiryDate) : undefined,
    });
    setFileList([]);
    setModalOpen(true);
  };

  const handleSubmit = async (values: ProductFormValues) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('manufacturer', values.manufacturer);
      if (values.brand) formData.append('brand', values.brand);
      if (values.category) formData.append('category', values.category);
      if (values.description) formData.append('description', values.description);
      if (values.batchNumber) formData.append('batchNumber', values.batchNumber);
      if (values.price !== undefined) formData.append('price', String(values.price));
      if (values.manufacturingDate) formData.append('manufacturingDate', values.manufacturingDate.toISOString());
      if (values.expiryDate) formData.append('expiryDate', values.expiryDate.toISOString());
      if (!editingProduct && values.barcode) formData.append('barcode', values.barcode);
      if (fileList[0]?.originFileObj) formData.append('image', fileList[0].originFileObj);

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, formData);
        message.success('Product updated');
      } else {
        await api.post('/products', formData);
        message.success('Product added');
      }

      setModalOpen(false);
      fetchProducts(search);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Save failed';
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/products/${id}`);
      message.success('Product removed');
      fetchProducts(search);
    } catch {
      message.error('Delete failed');
    }
  };

  const columns = [
    {
      title: 'Product',
      key: 'product',
      render: (_: unknown, record: Product) => (
        <Space>
          <img
            className="product-thumb"
            src={record.imageUrl ? `${API_ORIGIN}${record.imageUrl}` : undefined}
            alt=""
          />
          <div>
            <div style={{ fontWeight: 600 }}>{record.name}</div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              {record.brand}
            </div>
          </div>
        </Space>
      ),
    },
    { title: 'Barcode', dataIndex: 'barcode', key: 'barcode' },
    { title: 'Manufacturer', dataIndex: 'manufacturer', key: 'manufacturer' },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag color="purple">{category}</Tag>,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `₹${price?.toFixed(2)}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Product) => (
        <Space>
          <Button size="small" icon={<BarcodeOutlined />} onClick={() => setBarcodeProduct(record)}>
            Barcode
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          <Popconfirm title="Delete this product?" onConfirm={() => handleDelete(record._id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Product Management</h2>
          <div className="page-subtitle">Register products and assign unique verification barcodes</div>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
          Add Product
        </Button>
      </div>

      <div className="content-card">
        <Row style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search by name, barcode, manufacturer..."
              prefix={<SearchOutlined />}
              allowClear
              onChange={(e) => {
                setSearch(e.target.value);
                fetchProducts(e.target.value);
              }}
            />
          </Col>
        </Row>
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={products}
          loading={loading}
          scroll={{ x: true }}
          pagination={{ pageSize: 8 }}
        />
      </div>

      <Modal
        open={modalOpen}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        width={640}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="Product Name" rules={[{ required: true, message: 'Required' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="manufacturer" label="Manufacturer" rules={[{ required: true, message: 'Required' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="brand" label="Brand">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="Category">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="batchNumber" label="Batch Number">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="price" label="Price">
                <InputNumber style={{ width: '100%' }} min={0} addonBefore="₹" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="manufacturingDate" label="Manufacturing Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expiryDate" label="Expiry Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            {!editingProduct && (
              <Col span={24}>
                <Form.Item name="barcode" label="Barcode (leave blank to auto-generate)">
                  <Input placeholder="Auto-generated if left empty" />
                </Form.Item>
              </Col>
            )}
            <Col span={24}>
              <Form.Item name="description" label="Description">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Product Image">
                <Upload
                  listType="picture"
                  fileList={fileList}
                  beforeUpload={() => false}
                  onChange={({ fileList: fl }) => setFileList(fl.slice(-1))}
                  maxCount={1}
                >
                  <Button icon={<UploadOutlined />}>Select Image</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {barcodeProduct && (
        <BarcodeModal
          open={!!barcodeProduct}
          onClose={() => setBarcodeProduct(null)}
          productName={barcodeProduct.name}
          barcode={barcodeProduct.barcode}
        />
      )}
    </div>
  );
};

export default Products;
