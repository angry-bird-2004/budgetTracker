const mongoose = require('mongoose');

const incomeEnvelopeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide an income envelope name'],
      trim: true,
    },
    allocatedAmount: {
      type: Number,
      required: [true, 'Please provide an allocated amount'],
      default: 0,
      min: 0,
    },
    clientId: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

// Index common lookup fields
incomeEnvelopeSchema.index({ userId: 1, name: 1 });
incomeEnvelopeSchema.index({ userId: 1, clientId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('IncomeEnvelope', incomeEnvelopeSchema);