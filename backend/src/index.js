import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

import usersRouter from './routes/users.js';
import predictionsRouter from './routes/predictions.js';
import leaderboardRouter from './routes/leaderboard.js';
import adminRouter from './routes/admin.js';

dotenv.config();

// Set default timezone to Mexico City
process.env.TZ = 'America/Mexico_City';

const app = express();
const PORT = process.env.PORT || 3001;

// PostgreSQL connection pool with optimized settings
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,                    // Max number of connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Return error after 5s if can't connect
});

// Set timezone for each new connection
pool.on('connect', (client) => {
  client.query("SET timezone = 'America/Mexico_City'");
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to PostgreSQL database (Timezone: America/Mexico_City)');
    release();
  }
});

// Middleware
app.use(cors({
  origin: true, // Allow all origins
  credentials: true
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/users', usersRouter(pool));
app.use('/api/predictions', predictionsRouter(pool));
app.use('/api/leaderboard', leaderboardRouter(pool));
app.use('/api/admin', adminRouter(pool));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Game settings (public)
app.get('/api/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM game_settings WHERE id = 1');
    const settings = result.rows[0] || { responses_visible: false, predictions_locked: false };
    res.json({
      responsesVisible: settings.responses_visible,
      answersVisible: settings.responses_visible, // Alias for frontend compatibility
      predictionsLocked: settings.predictions_locked
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

// Public correct answers (only returns when answersVisible is true)
app.get('/api/answers', async (req, res) => {
  try {
    // First check if answers should be visible
    const settingsResult = await pool.query('SELECT responses_visible FROM game_settings WHERE id = 1');
    const settings = settingsResult.rows[0];

    if (!settings || !settings.responses_visible) {
      return res.json({}); // Return empty if not visible
    }

    // Get correct answers
    const result = await pool.query('SELECT question_id, answer FROM correct_answers ORDER BY question_id');

    const answers = {};
    result.rows.forEach(row => {
      answers[row.question_id] = row.answer;
    });

    res.json(answers);
  } catch (error) {
    console.error('Error getting public answers:', error);
    res.status(500).json({ error: 'Error al obtener respuestas' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
