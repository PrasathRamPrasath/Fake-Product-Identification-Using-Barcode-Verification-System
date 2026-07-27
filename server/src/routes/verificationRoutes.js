import express from 'express';
import verificationController from '../controllers/verificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const { verifyBarcode, getVerificationHistory } = verificationController;

router.post('/', protect, verifyBarcode);
router.get('/history', protect, getVerificationHistory);

export default router;
