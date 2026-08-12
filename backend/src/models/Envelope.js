const mongoose = require('mongoose');

const envelopeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  allocatedAmount: { type: Number, required: true, min: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Envelope', envelopeSchema);