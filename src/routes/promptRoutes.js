const express = require('express');
const router = express.Router();
const promptController = require('../controllers/promptController');
const authMiddleware = require('../middleware/auth');

/**
 * PATH: /api/prompts
 */

// Anyone logged in can see the questions
router.get('/questions', authMiddleware, promptController.getQuestions);

// Get my own answers
router.get('/me/answers', authMiddleware, promptController.getMyAnswers);

// Save an answer
router.post('/me/answers', authMiddleware, promptController.saveAnswer);

module.exports = router;
