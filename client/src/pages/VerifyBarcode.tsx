import { useEffect, useRef, useState } from 'react';
import { Button, Input, message, Row, Col, Descriptions, Tag } from 'antd';
import { CameraOutlined, StopOutlined, SearchOutlined, CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import api from '../utils/api';

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
}

interface VerifyResult {
  status: 'genuine' | 'counterfeit';
  product: Product | null;
}

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');
const SCANNER_ELEMENT_ID = 'barcode-scanner-region';

const VerifyBarcode = () => {
  const [manualBarcode, setManualBarcode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // scanner already stopped
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  const verifyBarcode = async (barcode: string) => {
    if (!barcode.trim()) {
      message.warning('Enter or scan a barcode first');
      return;
    }
    setVerifying(true);
    setResult(null);
    try {
      const { data } = await api.post<VerifyResult>('/verify', { barcode: barcode.trim() });
      setResult(data);
    } catch {
      message.error('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const startScanner = async () => {
    setResult(null);
    setScanning(true);
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
      ],
      verbose: false,
    });
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 140 },
        },
        async (decodedText) => {
          setManualBarcode(decodedText);
          await stopScanner();
          verifyBarcode(decodedText);
        },
        undefined
      );
    } catch {
      message.error('Unable to access camera. Check permissions or enter the barcode manually.');
      setScanning(false);
      scannerRef.current = null;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Verify Barcode</h2>
          <div className="page-subtitle">Scan a product barcode or enter it manually to check authenticity</div>
        </div>
      </div>

      <Row gutter={24}>
        <Col xs={24} md={10}>
          <div className="content-card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 12 }}>Manual Entry</h3>
            <Input.Search
              size="large"
              placeholder="Enter barcode number"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              onSearch={verifyBarcode}
              enterButton={<Button type="primary" icon={<SearchOutlined />} loading={verifying}>Verify</Button>}
            />

            <div style={{ marginTop: 24 }}>
              <h3 style={{ marginBottom: 12 }}>Camera Scan</h3>
              {!scanning ? (
                <Button icon={<CameraOutlined />} onClick={startScanner} block>
                  Start Camera Scan
                </Button>
              ) : (
                <Button danger icon={<StopOutlined />} onClick={stopScanner} block>
                  Stop Scanning
                </Button>
              )}
              <div id={SCANNER_ELEMENT_ID} style={{ marginTop: 12, borderRadius: 8, overflow: 'hidden' }} />
            </div>
          </div>
        </Col>

        <Col xs={24} md={14}>
          {result && (
            <div className="content-card">
              {result.status === 'genuine' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <CheckCircleFilled style={{ fontSize: 32, color: '#16a34a' }} />
                  <div>
                    <div className="status-genuine" style={{ fontSize: 20 }}>Genuine Product</div>
                    <div className="text-muted">This barcode matches a registered product</div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <CloseCircleFilled style={{ fontSize: 32, color: '#dc2626' }} />
                  <div>
                    <div className="status-counterfeit" style={{ fontSize: 20 }}>Possibly Counterfeit</div>
                    <div className="text-muted">No registered product matches this barcode</div>
                  </div>
                </div>
              )}

              {result.product && (
                <>
                  {result.product.imageUrl && (
                    <img
                      src={`${API_ORIGIN}${result.product.imageUrl}`}
                      alt={result.product.name}
                      style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }}
                    />
                  )}
                  <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label="Product Name">{result.product.name}</Descriptions.Item>
                    <Descriptions.Item label="Brand">{result.product.brand || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Manufacturer">{result.product.manufacturer}</Descriptions.Item>
                    <Descriptions.Item label="Category">
                      <Tag color="purple">{result.product.category}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Batch Number">{result.product.batchNumber || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Manufacturing Date">
                      {result.product.manufacturingDate
                        ? new Date(result.product.manufacturingDate).toLocaleDateString()
                        : '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Expiry Date">
                      {result.product.expiryDate ? new Date(result.product.expiryDate).toLocaleDateString() : '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Price">₹{result.product.price?.toFixed(2)}</Descriptions.Item>
                  </Descriptions>
                </>
              )}
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default VerifyBarcode;
