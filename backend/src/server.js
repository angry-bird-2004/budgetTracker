const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const compression = require('compression');
const helmet = require('helmet');
const Sentry = require('@sentry/node');

dotenv.config();

// Initialize Sentry if configured
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.05,
  });
}

if (process.env.MONGO_URI) {
  connectDB();
} else {
  console.warn('MONGO_URI is not set. Skipping MongoDB connection for now.');
}

const app = express();
app.use(express.json());
if (process.env.SENTRY_DSN) app.use(Sentry.Handlers.requestHandler());
app.use(helmet());
app.use(compression());

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8081',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8081',
  ...String(process.env.CLIENT_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
];

const isDevOrigin = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin) ||
  /^https?:\/\/(10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/i.test(origin) ||
  /^https?:\/\/(.*\.)?expo\.(dev|io)$/i.test(origin);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/i.test(origin) || isDevOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
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
app.use('/api/settings', require('./routes/settingRoutes'));
app.use('/api/sync', require('./routes/syncRoutes'));

// Sentry error handler should be after all routes
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
  // Optional: expose a minimal JSON error response including the Sentry event id
  app.use((err, req, res, next) => {
    // eslint-disable-next-line no-console
    console.error(err);
    const sentryId = res.sentry || null;
    res.status(500).json({ message: err.message || 'Internal Server Error', sentryId });
  });
}

if (require.main === module) {
  const PORT = process.env.PORT || 5001;
  const server = app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(
        `Port ${PORT} is already in use. On macOS, port 5000 is often taken by AirPlay Receiver. Set PORT in backend/.env to a free port.`,
      );
      process.exit(1);
    }
    throw error;
  });
}

module.exports = app;