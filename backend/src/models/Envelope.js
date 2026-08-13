const mongoose = require('mongoose');

const envelopeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  allocatedAmount: { type: Number, default: 0 }, // Target monthly budget
  currentBalance: { type: Number, default: 0 }, // Actual money inside
  isSystem: { type: Boolean, default: false } // To track the "Unallocated/Available" bucket
});

module.exports = mongoose.model('Envelope', envelopeSchema);