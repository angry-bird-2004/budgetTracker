const express = require('express');
const router = express.Router();
const { getSync } = require('../controllers/syncController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getSync);

module.exports = router;
