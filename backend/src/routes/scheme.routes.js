const express = require('express');
const router = express.Router();
const { recommendSchemes, getSchemeHistory } = require('../controllers/scheme.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/recommend', recommendSchemes);
router.get('/history',    getSchemeHistory);

module.exports = router;
