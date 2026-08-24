const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const { getPeriodRange } = require("../utils/periodRange");
const { taxAmountExpr } = require("../utils/taxAmountExpr");

const toObjectId = (value) => {
  if (typeof value !== "string" || !/^[a-fA-F0-9]{24}$/.test(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseIncomingDate = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "string") {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (match) {
      return new Date(
        Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0, 0),
      );
    }
  }
  return value;
};

const getTransactions = async (req, res) => {
  try {
    const {
      period, year, month, page = 1, limit = 50, search, type, sort, tzOffset,
      envelopeId, incomeSource,
    } = req.query;
    let query = { userId: req.user._id };
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);

    const range = getPeriodRange({ period, year, month, tzOffset });
    if (range) {
      query.date = { $gte: range.start, $lte: range.end };
    }

    if (type === "income" || type === "expense") {
      query.type = type;
    }

    const envelopeObjectId = toObjectId(envelopeId);
    if (envelopeObjectId) query.envelopeId = envelopeObjectId;

    const incomeSourceObjectId = toObjectId(incomeSource);
    if (incomeSourceObjectId) query.incomeSource = incomeSourceObjectId;

    const searchText = typeof search === "string" ? search.trim() : "";
    if (searchText) {
      const regex = new RegExp(escapeRegex(searchText), "i");
      query.$or = [
        { title: regex },
        { purpose: regex },
        { paymentMethod: regex },
      ];
    }

    const skip = (parsedPage - 1) * parsedLimit;
    const sortDir = sort === "oldest" ? 1 : -1;
    const periodQuery = { userId: req.user._id };
    if (query.date) periodQuery.date = query.date;

    const [total, transactions, summary] = await Promise.all([
      Transaction.countDocuments(query),
      Transaction.find(query)
        .populate("envelopeId", "name")
        .populate("incomeSource", "name allocatedAmount")
        .sort({ date: sortDir })
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      Transaction.aggregate([
        { $match: periodQuery },
        {
          $group: {
            _id: "$type",
            totalAmount: { $sum: "$amount" },
            totalTax: { $sum: taxAmountExpr },
          },
        },
      ]),
    ]);

    const totals = { income: 0, expense: 0, tax: 0 };
    summary.forEach((row) => {
      if (row._id === "income") totals.income = row.totalAmount || 0;
      if (row._id === "expense") {
        totals.expense = row.totalAmount || 0;
        totals.tax = row.totalTax || 0;
      }
    });

    const pages = Math.ceil(total / parsedLimit) || 1;

    res.status(200).json({
      transactions,
      total,
      page: parsedPage,
      pages,
      totals,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createTransaction = async (req, res) => {
  try {
    const {
      title, amount, type, envelopeId, paymentMethod,
      purpose, taxPercentage, taxAmount, taxApplication,
      date, incomeSource,
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
      date: parseIncomingDate(date) || Date.now(),
    });

    const populatedTx = await Transaction.findById(transaction._id)
      .populate("envelopeId", "name")
      .populate("incomeSource", "name allocatedAmount")
      .lean();

    res.status(201).json(populatedTx);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    const fields = [
      "title", "amount", "type", "date", "paymentMethod", 
      "purpose", "taxPercentage", "taxAmount", "taxApplication"
    ];
    
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        transaction[field] =
          field === "date" ? parseIncomingDate(req.body[field]) : req.body[field];
      }
    });

    transaction.envelopeId = transaction.type === "expense" ? (req.body.envelopeId || transaction.envelopeId) : undefined;
    transaction.incomeSource = req.body.incomeSource !== undefined ? req.body.incomeSource : transaction.incomeSource;

    if (req.body.updateLogs) transaction.updateLogs = req.body.updateLogs;

    await transaction.save();

    const updated = await Transaction.findById(transaction._id)
      .populate("envelopeId", "name")
      .populate("incomeSource", "name allocatedAmount")
      .lean();
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    res.status(200).json({ message: "Transaction deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTransactions, createTransaction, updateTransaction, deleteTransaction };