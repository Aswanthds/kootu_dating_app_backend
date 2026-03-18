const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');

router.post('/verify-purchase', authMiddleware, paymentController.verifyPurchase);

module.exports = router;
