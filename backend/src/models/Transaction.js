const mongoose = require('mongoose');

const updateLogSchema = new mongoose.Schema({
  before: { type: Number, required: true },
  after: { type: Number, required: true },
  diff: { type: Number, required: true },
  reason: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense', 'fill'], required: true },
  envelopeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Envelope' },
  paymentMethod: { type: String, default: 'cash' },
  purpose: { type: String },
  incomeSource: { type: mongoose.Schema.Types.ObjectId, ref: 'IncomeEnvelope', required: false, },
  taxPercentage: { type: Number },
  taxAmount: { type: Number },
  taxApplication: { type: String }, // 'exclusive' or 'inclusive'
  date: { type: Date, default: Date.now },
  updateLogs: [updateLogSchema],
  clientId: { type: String, trim: true },
}, { timestamps: true });

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, clientId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Transaction', transactionSchema);