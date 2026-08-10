import { useEffect, useRef, useState } from 'react';
import { Button, Input, message, Row, Col, Descriptions, Tag } from 'antd';
import { CameraOutlined, StopOutlined, SearchOutlined, CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import * as Tesseract from 'tesseract.js';
import api from '../utils/api';

// Reading the barcode's bars was unreliable through a webcam pointed at a
// phone screen (screen moiré + camera focus + resource contention during
// video calls all fought the ZXing decoder). The barcode image always
// displays its digits as text underneath the bars (see BarcodeImage.tsx),
// so instead we OCR that text — the same approach as typing it in manually,
// just automated. Only digits are ever expected, so the OCR engine is
// restricted to 0-9 for both speed and accuracy.
const OCR_TICK_MS = 700;

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

const VerifyBarcode = () => {
  const [manualBarcode, setManualBarcode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<Tesseract.Worker | null>(null);
  const ocrTimeoutRef = useRef<number | null>(null);
  const scanningRef = useRef(false);
  const handledRef = useRef(false);

  const stopScanner = () => {
    scanningRef.current = false;
    if (ocrTimeoutRef.current !== null) {
      window.clearTimeout(ocrTimeoutRef.current);
      ocrTimeoutRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setOcrStatus('');
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      scanningRef.current = false;
      if (ocrTimeoutRef.current !== null) window.clearTimeout(ocrTimeoutRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      workerRef.current?.terminate();
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

  // Grabs the current video frame, crops it to the centered guide box (see
  // the overlay in the JSX below) and upscales it — OCR accuracy on small
  // text improves a lot when the crop is enlarged before recognition.
  const captureGuideBoxFrame = (video: HTMLVideoElement) => {
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const cropWidth = vw * 0.8;
    const cropHeight = vh * 0.3;
    const sx = (vw - cropWidth) / 2;
    const sy = (vh - cropHeight) / 2;
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = cropWidth * scale;
    canvas.height = cropHeight * scale;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, sx, sy, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
    return canvas;
  };

  const runOcrTick = async () => {
    if (!scanningRef.current || handledRef.current) return;
    const video = videoRef.current;
    const worker = workerRef.current;
    if (video && worker && video.readyState >= video.HAVE_CURRENT_DATA) {
      setOcrStatus('Reading number…');
      try {
        const canvas = captureGuideBoxFrame(video);
        const { data } = await worker.recognize(canvas);
        const digits = data.text.match(/\d{6,}/)?.[0];
        if (digits && !handledRef.current) {
          handledRef.current = true;
          console.log('OCR read barcode number:', digits, '(raw text:', JSON.stringify(data.text), ')');
          setManualBarcode(digits);
          stopScanner();
          verifyBarcode(digits);
          return;
        }
      } catch (err) {
        console.error('OCR recognize failed:', err);
      }
    }
    if (scanningRef.current && !handledRef.current) {
      ocrTimeoutRef.current = window.setTimeout(runOcrTick, OCR_TICK_MS);
    }
  };

  const startScanner = async () => {
    setResult(null);
    setScanning(true);
    scanningRef.current = true;
    handledRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if (!workerRef.current) {
        setOcrStatus('Loading OCR engine…');
        const worker = await Tesseract.createWorker('eng');
        await worker.setParameters({
          tessedit_char_whitelist: '0123456789',
          tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE,
        });
        workerRef.current = worker;
      }

      runOcrTick();
    } catch (err) {
      console.error('Camera scan failed to start:', err);
      message.error('Unable to access camera. Check permissions or enter the barcode manually.');
      stopScanner();
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
              {scanning && (
                <div style={{ marginTop: 12, position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
                  <video ref={videoRef} muted playsInline style={{ width: '100%', display: 'block' }} />
                  <div
                    style={{
                      position: 'absolute',
                      top: '35%',
                      left: '10%',
                      width: '80%',
                      height: '30%',
                      border: '2px solid #fff',
                      borderRadius: 4,
                      boxShadow: '0 0 0 999px rgba(0,0,0,0.35)',
                      pointerEvents: 'none',
                    }}
                  />
                  {ocrStatus && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        left: 0,
                        right: 0,
                        textAlign: 'center',
                        color: '#fff',
                        fontSize: 12,
                        textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                      }}
                    >
                      {ocrStatus}
                    </div>
                  )}
                </div>
              )}
              {scanning && (
                <div className="text-muted" style={{ marginTop: 8, fontSize: 12 }}>
                  Align the printed number under the barcode inside the box
                </div>
              )}
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
