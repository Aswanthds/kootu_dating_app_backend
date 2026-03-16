const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');


router.get('/me', authMiddleware, userController.getMe);
router.put('/update', authMiddleware, userController.updateProfile);
router.get('/feed', authMiddleware, userController.getFeed);

module.exports = router;
