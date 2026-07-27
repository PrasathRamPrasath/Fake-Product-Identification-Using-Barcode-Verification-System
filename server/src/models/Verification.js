import mongoose from 'mongoose';

const verificationSchema = new mongoose.Schema(
  {
    barcodeScanned: {
      type: String,
      required: true,
      trim: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    status: {
      type: String,
      enum: ['genuine', 'counterfeit'],
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

verificationSchema.index({ barcodeScanned: 1 });
verificationSchema.index({ verifiedAt: -1 });

export default mongoose.model('Verification', verificationSchema);
