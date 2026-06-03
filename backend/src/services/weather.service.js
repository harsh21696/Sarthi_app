const { generateText } = require('./gemini.service');

// ─── Geocode city name to lat/lon using Nominatim (free, no key) ──────────────
const geocodeCity = async (city) => {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)},India&format=json&limit=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'GramSaathi-AI/1.0' } });
  const data = await res.json();
  if (!data.length) throw new Error(`City "${city}" not found`);
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), displayName: data[0].display_name };
};

// ─── Fetch weather from Open-Meteo (100% free, no API key) ───────────────────
const fetchWeather = async (lat, lon) => {
  const url = `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weathercode` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weathercode,precipitation_probability_max` +
    `&timezone=Asia%2FKolkata&forecast_days=7`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather API failed');
  return await res.json();
};

// ─── WMO weather code to description ─────────────────────────────────────────
const weatherCodeDesc = (code) => {
  const map = {
    0: 'Clear sky ☀️', 1: 'Mainly clear 🌤️', 2: 'Partly cloudy ⛅', 3: 'Overcast ☁️',
    45: 'Foggy 🌫️', 48: 'Icy fog 🌫️',
    51: 'Light drizzle 🌦️', 53: 'Moderate drizzle 🌦️', 55: 'Heavy drizzle 🌧️',
    61: 'Slight rain 🌧️', 63: 'Moderate rain 🌧️', 65: 'Heavy rain 🌧️',
    71: 'Slight snow 🌨️', 73: 'Moderate snow 🌨️', 75: 'Heavy snow ❄️',
    80: 'Slight showers 🌦️', 81: 'Moderate showers 🌧️', 82: 'Violent showers ⛈️',
    85: 'Snow showers 🌨️', 86: 'Heavy snow showers ❄️',
    95: 'Thunderstorm ⛈️', 96: 'Thunderstorm with hail ⛈️', 99: 'Thunderstorm with heavy hail ⛈️',
  };
  return map[code] || 'Unknown';
};

// ─── Analyze weather and generate crop disaster alerts ────────────────────────
const generateAlerts = (weatherData, primaryCrop) => {
  const alerts = [];
  const daily = weatherData.daily;
  const current = weatherData.current;

  const maxTemps = daily.temperature_2m_max;
  const minTemps = daily.temperature_2m_min;
  const rainSums = daily.precipitation_sum;
  const maxWind  = daily.wind_speed_10m_max;
  const rainProb = daily.precipitation_probability_max;

  // Heat wave: temp > 42°C for 2+ consecutive days
  const heatDays = maxTemps.filter(t => t > 42).length;
  if (heatDays >= 2) {
    alerts.push({
      type: 'heatwave', icon: '🔥', color: '#ef4444',
      title: `Heat Wave Warning — ${heatDays} days above 42°C`,
      description: `Extreme heat detected. ${primaryCrop ? `${primaryCrop} crops` : 'Crops'} are at risk of heat stress and wilting.`,
      action: 'Irrigate early morning/evening. Apply mulch to retain soil moisture. Provide shade nets if possible.',
      severity: 'high',
    });
  }

  // Frost: min temp < 5°C
  const frostDays = minTemps.filter(t => t < 5).length;
  if (frostDays >= 1) {
    alerts.push({
      type: 'frost', icon: '❄️', color: '#38bdf8',
      title: `Frost Warning — ${frostDays} night(s) below 5°C`,
      description: `Near-freezing temperatures expected. ${primaryCrop ? `${primaryCrop} crops` : 'Crops'} may suffer frost damage.`,
      action: 'Cover seedlings with cloth/plastic at night. Light irrigation before sunset creates warmth. Avoid waterlogging.',
      severity: 'high',
    });
  }

  // Heavy rainfall: > 50mm on a single day
  const heavyRainDay = rainSums.findIndex(r => r > 50);
  if (heavyRainDay >= 0) {
    alerts.push({
      type: 'flood', icon: '🌊', color: '#3b82f6',
      title: `Heavy Rainfall Alert — ${Math.round(rainSums[heavyRainDay])}mm expected on Day ${heavyRainDay + 1}`,
      description: `Flooding risk in low-lying fields. Root rot and soil erosion likely.`,
      action: 'Clear drainage channels immediately. Harvest mature crops before rain. Avoid fertilizer application.',
      severity: 'high',
    });
  }

  // Strong winds: > 60 km/h
  const windDay = maxWind.findIndex(w => w > 60);
  if (windDay >= 0) {
    alerts.push({
      type: 'wind', icon: '💨', color: '#a855f7',
      title: `Strong Wind Warning — ${Math.round(maxWind[windDay])} km/h on Day ${windDay + 1}`,
      description: `High winds can lodge tall crops and damage fruit. Pollination may be disrupted.`,
      action: 'Stake tall crops (sugarcane, maize). Use windbreaker nets. Delay spraying operations.',
      severity: 'medium',
    });
  }

  // Drought: no rain for 7 days
  const totalRain = rainSums.reduce((a, b) => a + b, 0);
  if (totalRain < 2) {
    alerts.push({
      type: 'drought', icon: '🌵', color: '#f59e0b',
      title: 'Dry Spell Alert — No significant rainfall in 7 days',
      description: `Soil moisture likely very low. ${primaryCrop ? `${primaryCrop} crops` : 'Crops'} may face water stress.`,
      action: 'Switch to drip irrigation. Apply mulch. Avoid deep ploughing to retain moisture.',
      severity: 'medium',
    });
  }

  // High rain probability (> 80%) — good news
  const highRainProb = rainProb.filter(p => p > 80).length;
  if (highRainProb >= 3 && totalRain > 5) {
    alerts.push({
      type: 'rain_forecast', icon: '🌧️', color: '#22c55e',
      title: `Good Rainfall Expected — ${highRainProb} rainy days ahead`,
      description: 'Favorable moisture conditions coming. Good time for sowing or fertilizer application.',
      action: 'Prepare land for sowing. Apply base fertilizer before rain. Check drainage to avoid waterlogging.',
      severity: 'info',
    });
  }

  return alerts;
};

// ─── Get crop advice from AI based on weather ─────────────────────────────────
const getCropWeatherAdvice = async (weatherData, primaryCrop, city) => {
  const current = weatherData.current;
  const daily   = weatherData.daily;

  const summary = `
Current conditions in ${city}:
- Temperature: ${current.temperature_2m}°C (feels like ${current.apparent_temperature}°C)
- Humidity: ${current.relative_humidity_2m}%
- Wind: ${current.wind_speed_10m} km/h
- Precipitation today: ${current.precipitation}mm
- Condition: ${weatherCodeDesc(current.weathercode)}

7-day forecast:
${daily.time.map((date, i) => `${date}: Max ${daily.temperature_2m_max[i]}°C, Min ${daily.temperature_2m_min[i]}°C, Rain ${daily.precipitation_sum[i]}mm (${daily.precipitation_probability_max[i]}% chance), ${weatherCodeDesc(daily.weathercode[i])}`).join('\n')}

Primary crop: ${primaryCrop || 'Mixed/Unknown'}
`;

  const prompt = `You are an expert agronomist in India. Based on this weather data, give practical farming advice for the next 7 days.

${summary}

Provide:
1. **Overall Assessment**: Is this weather good or bad for farming?
2. **Immediate Actions** (next 2 days): What should the farmer do right now?
3. **This Week's Plan** (days 3-7): Specific farming activities to do or avoid
4. **Crop Care Tips**: Specific advice for ${primaryCrop || 'general crops'}
5. **Opportunity**: Any favorable conditions to take advantage of?

Keep it practical, simple, and suitable for a rural Indian farmer. Use bullet points.`;

  return await generateText(prompt);
};

// ─── Main weather function (geocode + fetch + analyze) ───────────────────────
const getWeatherForCity = async (city, primaryCrop) => {
  const { lat, lon, displayName } = await geocodeCity(city);
  const weatherData = await fetchWeather(lat, lon);
  const alerts = generateAlerts(weatherData, primaryCrop);
  return { lat, lon, displayName, weatherData, alerts };
};

module.exports = {
  geocodeCity,
  fetchWeather,
  weatherCodeDesc,
  generateAlerts,
  getCropWeatherAdvice,
  getWeatherForCity,
};
