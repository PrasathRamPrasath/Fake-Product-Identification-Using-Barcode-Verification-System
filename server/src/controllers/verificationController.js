import Product from '../models/Product.js';
import Verification from '../models/Verification.js';

// @desc    Verify a product by barcode (scanned or typed manually)
// @route   POST /api/verify
// @access  Private
const verifyBarcode = async (req, res) => {
  try {
    const { barcode } = req.body;
    if (!barcode || !barcode.trim()) {
      return res.status(400).json({ message: 'Barcode is required' });
    }

    const product = await Product.findOne({ barcode: barcode.trim() });
    const status = product ? 'genuine' : 'counterfeit';

    const verification = await Verification.create({
      barcodeScanned: barcode.trim(),
      product: product ? product._id : null,
      status,
      user: req.user._id,
    });

    res.status(201).json({
      status,
      product: product || null,
      verification,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    List verification history (admin sees all, user sees their own)
// @route   GET /api/verify/history
// @access  Private
const getVerificationHistory = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { user: req.user._id };

    const history = await Verification.find(filter)
      .populate('product', 'name barcode manufacturer imageUrl')
      .populate('user', 'name email')
      .sort({ verifiedAt: -1 })
      .limit(500);

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  verifyBarcode,
  getVerificationHistory,
};
