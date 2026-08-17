const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

if (process.env.MONGO_URI) {
  connectDB();
} else {
  console.warn('MONGO_URI is not set. Skipping MongoDB connection for now.');
}

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || true,
  credentials: true,
}));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'backend running' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/envelopes', require('./routes/envelopeRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Backend server running on port http://localhost:${PORT}`));
}

module.exports = app;