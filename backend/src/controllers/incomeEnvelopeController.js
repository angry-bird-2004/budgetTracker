const IncomeEnvelope = require('../models/IncomeEnvelope');

const getIncomeEnvelopes = async (req, res) => {
  try {
    const incomeEnvelopes = await IncomeEnvelope.find({ userId: req.user._id });
    res.status(200).json(incomeEnvelopes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createIncomeEnvelope = async (req, res) => {
  try {
    const { name, allocatedAmount } = req.body;
    const incomeEnvelope = await IncomeEnvelope.create({
      userId: req.user._id,
      name,
      allocatedAmount,
    });
    res.status(201).json(incomeEnvelope);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateIncomeEnvelope = async (req, res) => {
  try {
    const incomeEnvelope = await IncomeEnvelope.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!incomeEnvelope) {
      return res.status(404).json({ message: 'Income envelope not found' });
    }

    incomeEnvelope.name = req.body.name || incomeEnvelope.name;
    incomeEnvelope.allocatedAmount =
      req.body.allocatedAmount !== undefined
        ? req.body.allocatedAmount
        : incomeEnvelope.allocatedAmount;

    const updated = await incomeEnvelope.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteIncomeEnvelope = async (req, res) => {
  try {
    const incomeEnvelope = await IncomeEnvelope.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!incomeEnvelope) {
      return res.status(404).json({ message: 'Income envelope not found' });
    }
    res.status(200).json({ message: 'Income envelope deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getIncomeEnvelopes,
  createIncomeEnvelope,
  updateIncomeEnvelope,
  deleteIncomeEnvelope,
};