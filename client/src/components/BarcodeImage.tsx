import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeImageProps {
  value: string;
  height?: number;
  width?: number;
  margin?: number;
}

const BarcodeImage = ({ value, height = 60, width = 2, margin = 8 }: BarcodeImageProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        width,
        height,
        displayValue: true,
        fontSize: 14,
        margin,
      });
    }
  }, [value, height, width, margin]);

  return <svg ref={svgRef} />;
};

export default BarcodeImage;
