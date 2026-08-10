import { useRef } from 'react';
import { Modal, Button, Space } from 'antd';
import { DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import BarcodeImage from './BarcodeImage';
import { downloadSvgAsPng, printSvg } from '../utils/barcodeDownload';

interface BarcodeModalProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  barcode: string;
}

const BarcodeModal = ({ open, onClose, productName, barcode }: BarcodeModalProps) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const getSvg = () => wrapperRef.current?.querySelector('svg') ?? null;

  return (
    <Modal open={open} onCancel={onClose} footer={null} title={`Barcode — ${productName}`} centered>
      <div ref={wrapperRef} style={{ display: 'flex', justifyContent: 'center', padding: 16, background: '#fff' }}>
        <BarcodeImage value={barcode} height={140} width={3} margin={16} />
      </div>
      <Space style={{ width: '100%', justifyContent: 'center' }}>
        <Button
          icon={<DownloadOutlined />}
          onClick={() => {
            const svg = getSvg();
            if (svg) downloadSvgAsPng(svg, `${barcode}.png`);
          }}
        >
          Download PNG
        </Button>
        <Button
          icon={<PrinterOutlined />}
          onClick={() => {
            const svg = getSvg();
            if (svg) printSvg(svg, productName);
          }}
        >
          Print
        </Button>
      </Space>
    </Modal>
  );
};

export default BarcodeModal;
