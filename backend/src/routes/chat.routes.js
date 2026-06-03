const express = require('express');
const router = express.Router();
const { sendMessage, getSessions, getSessionMessages, deleteSession } = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/send',               sendMessage);
router.get('/sessions',            getSessions);
router.get('/sessions/:id',        getSessionMessages);
router.delete('/sessions/:id',     deleteSession);

module.exports = router;
