const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const compression = require('compression');
const helmet = require('helmet');

dotenv.config();

if (process.env.MONGO_URI) {
  connectDB();
} else {
  console.warn('MONGO_URI is not set. Skipping MongoDB connection for now.');
}

const app = express();
app.use(express.json());
app.use(helmet());
app.use(compression());

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  ...String(process.env.CLIENT_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/i.test(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'backend running' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/envelopes', require('./routes/envelopeRoutes'));
app.use('/api/income-envelopes', require('./routes/incomeEnvelopeRoutes')); // <--- Added Income Envelopes Route
app.use('/api/transactions', require('./routes/transactionRoutes'));

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Backend server running on port http://localhost:${PORT}`));
}

module.exports = app;