const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const authMiddleware = require('../middleware/auth');



router.post('/pick', authMiddleware, matchController.pickUser);
router.get('/my-picks', authMiddleware, matchController.getMyPicks);
router.get('/who-picked-me', authMiddleware, matchController.getWhoPickedMe);

module.exports = router;
