const express = require('express');
const router = express.Router();
const { register, login, refresh, logout, me, verifyOtp, resendOtp } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/register',    register);
router.post('/login',       login);
router.post('/verify-otp',  verifyOtp);
router.post('/resend-otp',  resendOtp);
router.post('/refresh',     refresh);
router.post('/logout',      authenticate, logout);
router.get('/me',           authenticate, me);

module.exports = router;
