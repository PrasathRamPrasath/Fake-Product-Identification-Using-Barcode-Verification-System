import express from 'express';
const router = express.Router();

import userRoutes from './userRoutes.js';
import productRoutes from './productRoutes.js';
import verificationRoutes from './verificationRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';

router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/verify', verificationRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
