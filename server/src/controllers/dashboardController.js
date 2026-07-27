import Product from '../models/Product.js';
import Verification from '../models/Verification.js';
import User from '../models/User.js';

// @desc    Aggregate stats + recent activity for the admin dashboard
// @route   GET /api/dashboard/summary
// @access  Private/Admin
const getSummary = async (req, res) => {
  try {
    const [totalProducts, totalVerifications, genuineCount, counterfeitCount, totalUsers] =
      await Promise.all([
        Product.countDocuments(),
        Verification.countDocuments(),
        Verification.countDocuments({ status: 'genuine' }),
        Verification.countDocuments({ status: 'counterfeit' }),
        User.countDocuments(),
      ]);

    const recentActivity = await Verification.find()
      .populate('product', 'name barcode')
      .populate('user', 'name email')
      .sort({ verifiedAt: -1 })
      .limit(10);

    res.json({
      totalProducts,
      totalVerifications,
      genuineCount,
      counterfeitCount,
      totalUsers,
      recentActivity,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verification counts grouped by day for the last N days (default 14)
// @route   GET /api/dashboard/reports?range=30
// @access  Private/Admin
const getReports = async (req, res) => {
  try {
    const range = Math.min(Number(req.query.range) || 14, 90);
    const since = new Date();
    since.setDate(since.getDate() - range + 1);
    since.setHours(0, 0, 0, 0);

    const results = await Verification.aggregate([
      { $match: { verifiedAt: { $gte: since } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$verifiedAt' } },
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    const byDate = {};
    results.forEach((row) => {
      const { date, status } = row._id;
      if (!byDate[date]) {
        byDate[date] = { date, genuine: 0, counterfeit: 0 };
      }
      byDate[date][status] = row.count;
    });

    res.json(Object.values(byDate));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default { getSummary, getReports };
