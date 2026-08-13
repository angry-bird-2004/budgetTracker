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
  envelopeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Envelope' }, // Null for income
  date: { type: Date, default: Date.now },
  updateLog: updateLogSchema // Added to track amount edits, reasons, and differences
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);