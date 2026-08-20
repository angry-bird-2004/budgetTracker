const Transaction = require("../models/Transaction");

const getTransactions = async (req, res) => {
  try {
    const { period, year, month } = req.query;
    let query = { userId: req.user._id };
    const now = new Date();
    const currentYear = year ? parseInt(year) : now.getFullYear();
    const currentMonth = month ? parseInt(month) - 1 : now.getMonth();

    if (period === "weekly") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfWeek, $lte: endOfWeek };
    } else if (period === "monthly") {
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(
        currentYear,
        currentMonth + 1,
        0,
        23,
        59,
        59,
        999,
      );
      query.date = { $gte: startOfMonth, $lte: endOfMonth };
    } else if (period === "financial-year") {
      const fiscalStartMonth = 6; // July
      const fiscalStartYear =
        currentMonth >= fiscalStartMonth ? currentYear : currentYear - 1;
      const startOfFinancialYear = new Date(
        fiscalStartYear,
        fiscalStartMonth,
        1,
      );
      const endOfFinancialYear = new Date(
        fiscalStartYear + 1,
        fiscalStartMonth,
        0,
        23,
        59,
        59,
        999,
      );
      query.date = { $gte: startOfFinancialYear, $lte: endOfFinancialYear };
    } else if (period === "yearly") {
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);
      query.date = { $gte: startOfYear, $lte: endOfYear };
    }

    const transactions = await Transaction.find(query)
      .populate("envelopeId", "name")
      .populate("incomeSource", "name allocatedAmount")
      .sort({ date: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createTransaction = async (req, res) => {
  try {
    const {
      title,
      amount,
      type,
      envelopeId,
      paymentMethod,
      purpose,
      taxPercentage,
      taxAmount,
      taxApplication,
      date,
      incomeSource,
    } = req.body;

    const transaction = await Transaction.create({
      userId: req.user._id,
      title,
      amount,
      type,
      envelopeId: type === "expense" ? envelopeId : undefined,
      incomeSource: incomeSource || undefined,
      paymentMethod,
      purpose,
      taxPercentage,
      taxAmount,
      taxApplication,
      date: date || Date.now(),
    });

    // Populate envelope data before sending response back
    const populatedTx = await Transaction.findById(transaction._id)
      .populate("envelopeId", "name")
      .populate("incomeSource", "name allocatedAmount");

    res.status(201).json(populatedTx);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });

    transaction.title = req.body.title || transaction.title;
    transaction.amount =
      req.body.amount !== undefined ? req.body.amount : transaction.amount;
    transaction.type = req.body.type || transaction.type;
    transaction.envelopeId =
      transaction.type === "expense"
        ? req.body.envelopeId || transaction.envelopeId
        : undefined;
    transaction.incomeSource =
      req.body.incomeSource !== undefined
        ? req.body.incomeSource
        : transaction.incomeSource;
    transaction.date = req.body.date || transaction.date;

    // New: allow updating payment method, purpose, and tax fields
    transaction.paymentMethod =
      req.body.paymentMethod || transaction.paymentMethod;
    transaction.purpose = req.body.purpose || transaction.purpose;
    transaction.taxPercentage =
      req.body.taxPercentage !== undefined
        ? req.body.taxPercentage
        : transaction.taxPercentage;
    transaction.taxAmount =
      req.body.taxAmount !== undefined
        ? req.body.taxAmount
        : transaction.taxAmount;
    transaction.taxApplication =
      req.body.taxApplication || transaction.taxApplication;

    // Push multiple logs cleanly into the array
    if (req.body.updateLogs) {
      transaction.updateLogs = req.body.updateLogs;
    }

    await transaction.save();

    const updated = await Transaction.findById(transaction._id)
      .populate("envelopeId", "name")
      .populate("incomeSource", "name allocatedAmount");
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });
    res.status(200).json({ message: "Transaction deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
