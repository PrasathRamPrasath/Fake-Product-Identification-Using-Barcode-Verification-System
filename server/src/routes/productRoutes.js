import express from 'express';
import productController from '../controllers/productController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = productController;

router
  .route('/')
  .get(protect, adminOnly, getProducts)
  .post(protect, adminOnly, upload.single('image'), createProduct);

router
  .route('/:id')
  .get(protect, adminOnly, getProductById)
  .put(protect, adminOnly, upload.single('image'), updateProduct)
  .delete(protect, adminOnly, deleteProduct);

export default router;
