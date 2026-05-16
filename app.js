// app.js
const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const rateLimit    = require('express-rate-limit');

const authRoutes    = require('./routes/auth.routes');
const adminRoutes   = require('./routes/admin.routes');
const teacherRoutes = require('./routes/teacher.routes');
const parentRoutes  = require('./routes/parent.routes');
const studentRoutes = require('./routes/student.routes');

const app = express();
// ── Confiance au proxy Railway ─────────────────────────────
app.set('trust proxy', 1);

// ── Sécurité ──────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*' }));

// ── Rate limiting ─────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  message:  { success: false, message: 'Trop de requêtes. Réessayez plus tard.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { success: false, message: 'Trop de tentatives de connexion.' },
});

app.use(globalLimiter);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',    authLimiter, authRoutes);
app.use('/api/admin',   adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/parent',  parentRoutes);
app.use('/api/student', studentRoutes);

// ── Santé ─────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:  'OK',
    app:     'Tayamana API',
    version: '1.0.0',
  });
});

// ── Route inconnue ────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route introuvable.',
  });
});

// ── Erreur globale ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Erreur serveur :', err.stack);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Erreur interne du serveur.'
      : err.message,
  });
});

module.exports = app;