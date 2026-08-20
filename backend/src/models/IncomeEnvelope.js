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
  },
  {
    timestamps: true,
  }
);

// Index common lookup fields
incomeEnvelopeSchema.index({ userId: 1, name: 1 });

module.exports = mongoose.model('IncomeEnvelope', incomeEnvelopeSchema);