// GramSaathi AI — Main Server Entry Point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const authRoutes    = require('./src/routes/auth.routes');
const chatRoutes    = require('./src/routes/chat.routes');
const cropRoutes    = require('./src/routes/crop.routes');
const schemeRoutes  = require('./src/routes/scheme.routes');
const userRoutes    = require('./src/routes/user.routes');
const weatherRoutes = require('./src/routes/weather.routes');
const adminRoutes   = require('./src/routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ─────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

// ─── General Middleware ──────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Request Timeout (30s max — prevents hanging AI requests) ────────────────
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    console.error(`[TIMEOUT] ${req.method} ${req.path} timed out after 30s`);
    if (!res.headersSent) {
      res.status(504).json({ error: 'Request timed out. Please try again.' });
    }
  });
  next();
});

// ─── Static Files (uploads) ──────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'GramSaathi AI Backend', timestamp: new Date().toISOString() });
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/chat',    chatRoutes);
app.use('/api/crop',    cropRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/user',    userRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/admin',   adminRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack || err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Start ───────────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🌿 GramSaathi AI Backend running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
}

module.exports = app;
