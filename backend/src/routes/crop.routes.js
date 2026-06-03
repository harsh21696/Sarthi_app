const express = require('express');
const router = express.Router();
const { analyzeCrop, getCropHistory } = require('../controllers/crop.controller');
const { authenticate } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.use(authenticate);

router.post('/analyze', upload.single('image'), analyzeCrop);
router.get('/history',  getCropHistory);

module.exports = router;
