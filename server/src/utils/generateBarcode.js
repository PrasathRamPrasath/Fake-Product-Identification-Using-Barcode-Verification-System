import Product from '../models/Product.js';

// Builds a 13-digit EAN-13 compliant numeric barcode (12 random digits + check digit)
const buildEan13 = () => {
  let digits = '';
  for (let i = 0; i < 12; i += 1) {
    digits += Math.floor(Math.random() * 10);
  }

  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    sum += Number(digits[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return `${digits}${checkDigit}`;
};

const generateUniqueBarcode = async () => {
  let barcode = buildEan13();
  let existing = await Product.findOne({ barcode });
  let attempts = 0;

  while (existing && attempts < 10) {
    barcode = buildEan13();
    existing = await Product.findOne({ barcode });
    attempts += 1;
  }

  return barcode;
};

export default generateUniqueBarcode;
