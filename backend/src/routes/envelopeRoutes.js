const express = require("express");
const router = express.Router();
const {
  getTransferHistory,
  getEnvelopes,
  createEnvelope,
  updateEnvelope,
  deleteEnvelope,
  transferFunds,
  deleteTransfer,
  updateTransferFunds,
} = require("../controllers/envelopeController");
const { protect } = require("../middleware/authMiddleware");

router.get("/transfers", protect, getTransferHistory);
router
  .route("/transfers/:id")
  .put(protect, updateTransferFunds)
  .delete(protect, deleteTransfer);
router.route("/").get(protect, getEnvelopes).post(protect, createEnvelope);
router.post("/transfer", protect, transferFunds);
router
  .route("/:id")
  .put(protect, updateEnvelope)
  .delete(protect, deleteEnvelope);

module.exports = router;
