import express from 'express';
import dashboardController from '../controllers/dashboardController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();
const { getSummary, getReports } = dashboardController;

router.get('/summary', protect, adminOnly, getSummary);
router.get('/reports', protect, adminOnly, getReports);

export default router;
