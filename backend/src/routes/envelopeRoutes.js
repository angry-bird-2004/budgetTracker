const express = require('express');
const router = express.Router();
const { getEnvelopes, createEnvelope, updateEnvelope, deleteEnvelope, transferFunds } = require('../controllers/envelopeController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getEnvelopes).post(protect, createEnvelope);
router.post('/transfer', protect, transferFunds);
router.route('/:id').put(protect, updateEnvelope).delete(protect, deleteEnvelope);

module.exports = router;
