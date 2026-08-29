// backend/src/scripts/createIndexes.js
require('dotenv').config();
const connectDB = require('../config/db');
const mongoose = require('mongoose');

const Envelope = require('../models/Envelope');
const IncomeEnvelope = require('../models/IncomeEnvelope');
const Transaction = require('../models/Transaction');
const Setting = require('../models/Setting');
const RefreshToken = require('../models/RefreshToken');
const DeletedRecord = require('../models/DeletedRecord');

const run = async () => {
  try {
    await connectDB();

    console.log('Ensuring indexes...');
    await Promise.all([
      Envelope.syncIndexes(),
      IncomeEnvelope.syncIndexes(),
      Transaction.syncIndexes(),
      Setting.syncIndexes(),
      RefreshToken.syncIndexes(),
      DeletedRecord.syncIndexes(),
    ]);

    console.log('Indexes ensured successfully');
  } catch (err) {
    console.error('Failed to ensure indexes:', err);
    process.exitCode = 1;
  } finally {
    // Give some time for logs to flush then close
    setTimeout(() => mongoose.connection.close(), 500);
  }
};

run();
