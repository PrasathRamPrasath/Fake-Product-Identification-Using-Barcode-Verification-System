import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';
import generateUniqueBarcode from '../utils/generateBarcode.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

const removeImageFile = (imageUrl) => {
  if (!imageUrl) return;
  const filename = imageUrl.split('/uploads/')[1];
  if (!filename) return;
  const filePath = path.join(uploadsDir, filename);
  fs.unlink(filePath, () => {});
};

// @desc    Get all products (supports ?search= on name/barcode/manufacturer)
// @route   GET /api/products
// @access  Private/Admin
const getProducts = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { barcode: { $regex: search, $options: 'i' } },
            { manufacturer: { $regex: search, $options: 'i' } },
            { brand: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private/Admin
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new product (auto-generates barcode if not supplied)
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const {
      name,
      barcode,
      brand,
      manufacturer,
      category,
      description,
      manufacturingDate,
      expiryDate,
      batchNumber,
      price,
    } = req.body;

    let finalBarcode = barcode?.trim();
    if (finalBarcode) {
      const existing = await Product.findOne({ barcode: finalBarcode });
      if (existing) {
        return res.status(400).json({ message: 'A product with this barcode already exists' });
      }
    } else {
      finalBarcode = await generateUniqueBarcode();
    }

    const product = await Product.create({
      name,
      barcode: finalBarcode,
      brand,
      manufacturer,
      category,
      description,
      manufacturingDate: manufacturingDate || undefined,
      expiryDate: expiryDate || undefined,
      batchNumber,
      price,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : '',
      user: req.user._id,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const fields = [
      'name',
      'brand',
      'manufacturer',
      'category',
      'description',
      'manufacturingDate',
      'expiryDate',
      'batchNumber',
      'price',
    ];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    if (req.body.barcode && req.body.barcode.trim() !== product.barcode) {
      const existing = await Product.findOne({ barcode: req.body.barcode.trim() });
      if (existing) {
        return res.status(400).json({ message: 'A product with this barcode already exists' });
      }
      product.barcode = req.body.barcode.trim();
    }

    if (req.file) {
      removeImageFile(product.imageUrl);
      product.imageUrl = `/uploads/${req.file.filename}`;
    }

    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    removeImageFile(product.imageUrl);
    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
