const { getWeatherForCity, getCropWeatherAdvice, fetchWeather } = require('../services/weather.service');
const { sendDisasterAlertEmail } = require('../services/email.service');
const prisma = require('../config/prisma');

// ─── GET /api/weather?city=Pune&crop=Wheat ───────────────────────────────────
const getWeather = async (req, res) => {
  try {
    const city       = req.query.city || req.user.city || 'Delhi';
    const primaryCrop = req.query.crop || req.user.primaryCrop || null;

    const { lat, lon, displayName, weatherData, alerts } =
      await getWeatherForCity(city, primaryCrop);

    // Save location to user profile if not set
    if (!req.user.city && city) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { city, latitude: lat, longitude: lon },
      });
    }

    return res.json({
      location: { city, displayName, lat, lon },
      current: weatherData.current,
      daily: weatherData.daily,
      alerts,
    });
  } catch (err) {
    console.error('[WEATHER] getWeather error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to fetch weather' });
  }
};

// ─── POST /api/weather/advice — AI crop advice based on weather ──────────────
const getCropAdvice = async (req, res) => {
  try {
    const city       = req.body.city || req.user.city || 'Delhi';
    const primaryCrop = req.body.crop || req.user.primaryCrop || 'general crops';

    const { lat, lon, weatherData } = await getWeatherForCity(city, primaryCrop);
    const advice = await getCropWeatherAdvice(weatherData, primaryCrop, city);

    return res.json({ city, crop: primaryCrop, advice });
  } catch (err) {
    console.error('[WEATHER] getCropAdvice error:', err.message);
    return res.status(500).json({ error: 'Failed to get crop advice' });
  }
};

// ─── POST /api/weather/check-alerts — check & email disaster alerts ──────────
const checkAndSendAlerts = async (req, res) => {
  try {
    const city       = req.body.city || req.user.city;
    const primaryCrop = req.body.crop || req.user.primaryCrop;

    if (!city) return res.status(400).json({ error: 'City is required. Please set your city in profile.' });

    const { displayName, alerts } = await getWeatherForCity(city, primaryCrop);

    // Only send email for high/medium severity alerts
    const actionableAlerts = alerts.filter(a => a.severity === 'high' || a.severity === 'medium');

    if (actionableAlerts.length > 0 && req.user.emailVerified) {
      await sendDisasterAlertEmail(req.user.email, req.user.name, actionableAlerts, city);
    }

    return res.json({
      city,
      alertCount: alerts.length,
      alerts,
      emailSent: actionableAlerts.length > 0 && req.user.emailVerified,
    });
  } catch (err) {
    console.error('[WEATHER] checkAlerts error:', err.message);
    return res.status(500).json({ error: 'Failed to check alerts' });
  }
};

// ─── PUT /api/weather/location — save user's location & crop ─────────────────
const saveLocation = async (req, res) => {
  try {
    const { city, primaryCrop, latitude, longitude } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(city && { city }),
        ...(primaryCrop && { primaryCrop }),
        ...(latitude && { latitude: parseFloat(latitude) }),
        ...(longitude && { longitude: parseFloat(longitude) }),
      },
      select: { id: true, city: true, primaryCrop: true, latitude: true, longitude: true },
    });

    return res.json({ message: 'Location saved', user: updated });
  } catch (err) {
    console.error('[WEATHER] saveLocation error:', err.message);
    return res.status(500).json({ error: 'Failed to save location' });
  }
};

module.exports = { getWeather, getCropAdvice, checkAndSendAlerts, saveLocation };
