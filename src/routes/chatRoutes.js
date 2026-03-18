const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message_controller');
const authMiddleware = require('../middleware/auth');


router.get('/get-messages', authMiddleware, messageController.getMessages);
router.post('/sendMessage', authMiddleware, messageController.sendMessage);

module.exports = router;
