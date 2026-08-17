const express = require('express');
const router = express.Router();
const {
  getIncomeEnvelopes,
  createIncomeEnvelope,
  updateIncomeEnvelope,
  deleteIncomeEnvelope,
} = require('../controllers/incomeEnvelopeController'); // Ensure this controller exists with your CRUD logic
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getIncomeEnvelopes)
  .post(protect, createIncomeEnvelope);

router.route('/:id')
  .put(protect, updateIncomeEnvelope)
  .delete(protect, deleteIncomeEnvelope);

module.exports = router;