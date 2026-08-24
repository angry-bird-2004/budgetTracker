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
    const [stats, envelopes] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId: req.user._id, type: 'expense' } },
        { $group: { _id: '$envelopeId', consumed: { $sum: '$amount' } } },
      ]),
      Envelope.find({ userId: req.user._id }).lean(),
    ]);

    const consumedByEnvelope = new Map(
      stats.map((stat) => [String(stat._id), stat.consumed]),
    );

    const result = envelopes.map((env) => {
      const consumed = consumedByEnvelope.get(String(env._id)) || 0;
      return {
        ...env,
        consumed,
        currentBalance: (env.allocatedAmount || 0) - consumed,
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

    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({ message: 'Transfer type must be income or expense' });
    }
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
      Model.findOne({ _id: fromId, userId: req.user._id }).lean(),
      Model.findOne({ _id: toId, userId: req.user._id }).lean(),
    ]);

    if (!source || !destination) {
      return res.status(404).json({ message: 'Envelope not found' });
    }

    const consumed = await getConsumed(
      req.user._id,
      type === 'income' ? 'income' : 'expense',
      source._id,
    );
    const remaining = Number(source.allocatedAmount || 0) - consumed;
    if (parsedAmount > remaining) {
      return res.status(400).json({ message: 'Transfer exceeds remaining funds in the source envelope' });
    }

    const minAllocated = consumed + parsedAmount;
    const updatedSource = await Model.findOneAndUpdate(
      {
        _id: fromId,
        userId: req.user._id,
        allocatedAmount: { $gte: minAllocated },
      },
      { $inc: { allocatedAmount: -parsedAmount } },
      { new: true },
    );

    if (!updatedSource) {
      return res.status(409).json({
        message: 'Transfer could not be completed because the source envelope changed. Please retry.',
      });
    }

    try {
      const updatedDestination = await Model.findOneAndUpdate(
        { _id: toId, userId: req.user._id },
        { $inc: { allocatedAmount: parsedAmount } },
        { new: true },
      );

      if (!updatedDestination) {
        await Model.findOneAndUpdate(
          { _id: fromId, userId: req.user._id },
          { $inc: { allocatedAmount: parsedAmount } },
        );
        return res.status(404).json({ message: 'Envelope not found' });
      }

      return res.status(200).json({
        from: updatedSource,
        to: updatedDestination,
      });
    } catch (error) {
      await Model.findOneAndUpdate(
        { _id: fromId, userId: req.user._id },
        { $inc: { allocatedAmount: parsedAmount } },
      );
      throw error;
    }
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
