const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getWeather, getCropAdvice, checkAndSendAlerts, saveLocation } = require('../controllers/weather.controller');

// All weather routes require authentication
router.use(authenticate);

router.get('/', getWeather);                    // GET  /api/weather?city=Pune
router.post('/advice', getCropAdvice);          // POST /api/weather/advice
router.post('/check-alerts', checkAndSendAlerts); // POST /api/weather/check-alerts
router.put('/location', saveLocation);          // PUT  /api/weather/location

module.exports = router;
