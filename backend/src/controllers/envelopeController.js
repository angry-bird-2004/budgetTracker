const Envelope = require('../models/Envelope');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

const getEnvelopes = async (req, res) => {
  try {
    // Aggregation to calculate total consumed per envelope
    const stats = await Transaction.aggregate([
      { $match: { userId: req.user._id, type: 'expense' } },
      { $group: { _id: "$envelopeId", consumed: { $sum: "$amount" } } }
    ]);

    const envelopes = await Envelope.find({ userId: req.user._id }).lean();

    const result = envelopes.map(env => {
      const stat = stats.find(s => String(s._id) === String(env._id));
      return {
        ...env,
        consumed: stat ? stat.consumed : 0,
        currentBalance: env.allocatedAmount - (stat ? stat.consumed : 0)
      };
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createEnvelope = async (req, res) => {
  try {
    const { name, allocatedAmount } = req.body;
    const envelope = await Envelope.create({ userId: req.user._id, name, allocatedAmount });
    res.status(201).json(envelope);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateEnvelope = async (req, res) => {
  try {
    const envelope = await Envelope.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true }
    ).lean();
    if (!envelope) return res.status(404).json({ message: 'Envelope not found' });
    res.status(200).json(envelope);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteEnvelope = async (req, res) => {
  try {
    const envelope = await Envelope.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!envelope) return res.status(404).json({ message: 'Envelope not found' });
    res.status(200).json({ message: 'Envelope deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getEnvelopes, createEnvelope, updateEnvelope, deleteEnvelope };