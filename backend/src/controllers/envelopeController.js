const Envelope = require('../models/Envelope');

const getEnvelopes = async (req, res) => {
  try {
    const envelopes = await Envelope.find({ userId: req.user._id });
    res.status(200).json(envelopes);
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
    const envelope = await Envelope.findOne({ _id: req.params.id, userId: req.user._id });
    if (!envelope) return res.status(404).json({ message: 'Envelope not found' });
    
    envelope.name = req.body.name || envelope.name;
    envelope.allocatedAmount = req.body.allocatedAmount !== undefined ? req.body.allocatedAmount : envelope.allocatedAmount;
    
    const updated = await envelope.save();
    res.status(200).json(updated);
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