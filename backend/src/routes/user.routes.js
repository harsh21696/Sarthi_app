const express = require('express');
const router = express.Router();
const { updateProfile, getDashboard } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.patch('/profile',   updateProfile);
router.get('/dashboard',   getDashboard);

module.exports = router;
