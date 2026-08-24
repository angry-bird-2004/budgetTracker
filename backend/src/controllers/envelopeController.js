const Envelope = require('../models/Envelope');
const IncomeEnvelope = require('../models/IncomeEnvelope');
const Transaction = require('../models/Transaction');

const getConsumed = async (userId, type, envelopeId) => {
  const match =
    type === 'income'
      ? { userId, type: 'expense', incomeSource: envelopeId }
      : { userId, type: 'expense', envelopeId };

  const stats = await Transaction.aggregate([
    { $match: match },
    { $group: { _id: null, consumed: { $sum: '$amount' } } },
  ]);

  return stats[0]?.consumed || 0;
};

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
    const update = {};
    if (req.body.name !== undefined) update.name = req.body.name;
    if (req.body.allocatedAmount !== undefined) {
      update.allocatedAmount = req.body.allocatedAmount;
    }

    const envelope = await Envelope.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: update },
      { new: true }
    ).lean();
    if (!envelope) return res.status(404).json({ message: 'Envelope not found' });
    res.status(200).json(envelope);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const transferFunds = async (req, res) => {
  try {
    const { type = 'expense', fromId, toId, amount } = req.body;
    const parsedAmount = Number(amount);

    if (!fromId || !toId) {
      return res.status(400).json({ message: 'Source and destination envelopes are required' });
    }
    if (String(fromId) === String(toId)) {
      return res.status(400).json({ message: 'Source and destination envelopes cannot be the same' });
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'Transfer amount must be a positive number' });
    }

    const Model = type === 'income' ? IncomeEnvelope : Envelope;
    const [source, destination] = await Promise.all([
      Model.findOne({ _id: fromId, userId: req.user._id }),
      Model.findOne({ _id: toId, userId: req.user._id }),
    ]);

    if (!source || !destination) {
      return res.status(404).json({ message: 'Envelope not found' });
    }

    const consumed = await getConsumed(req.user._id, type === 'income' ? 'income' : 'expense', source._id);
    const remaining = Number(source.allocatedAmount || 0) - consumed;
    if (parsedAmount > remaining) {
      return res.status(400).json({ message: 'Transfer exceeds remaining funds in the source envelope' });
    }

    const originalSourceAmount = source.allocatedAmount;
    source.allocatedAmount = originalSourceAmount - parsedAmount;
    destination.allocatedAmount = Number(destination.allocatedAmount || 0) + parsedAmount;

    await source.save();
    try {
      await destination.save();
    } catch (error) {
      source.allocatedAmount = originalSourceAmount;
      await source.save();
      throw error;
    }

    res.status(200).json({
      from: source,
      to: destination,
    });
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

module.exports = { getEnvelopes, createEnvelope, updateEnvelope, deleteEnvelope, transferFunds };