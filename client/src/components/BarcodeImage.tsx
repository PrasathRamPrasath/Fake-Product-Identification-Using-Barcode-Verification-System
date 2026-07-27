import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeImageProps {
  value: string;
  height?: number;
}

const BarcodeImage = ({ value, height = 60 }: BarcodeImageProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        width: 2,
        height,
        displayValue: true,
        fontSize: 14,
        margin: 8,
      });
    }
  }, [value, height]);

  return <svg ref={svgRef} />;
};

export default BarcodeImage;
