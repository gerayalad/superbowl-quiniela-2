import { Router } from 'express';
import crypto from 'crypto';

// Simple hash function for PIN (not for high-security, just basic protection)
function hashPin(pin) {
  return crypto.createHash('sha256').update(pin).digest('hex');
}

// Total number of questions in the quiniela
const TOTAL_QUESTIONS = 17;

export default function usersRouter(pool) {
  const router = Router();

  // Check if nickname exists
  router.post('/check', async (req, res) => {
    try {
      const { nickname } = req.body;

      if (!nickname || nickname.trim().length < 2) {
        return res.status(400).json({ error: 'Nickname debe tener al menos 2 caracteres' });
      }

      const result = await pool.query(
        'SELECT id, nickname, pin_hash IS NOT NULL as has_pin FROM users WHERE LOWER(nickname) = LOWER($1)',
        [nickname.trim()]
      );

      if (result.rows.length > 0) {
        res.json({ exists: true, hasPin: result.rows[0].has_pin });
      } else {
        res.json({ exists: false });
      }
    } catch (error) {
      console.error('Error checking user:', error);
      res.status(500).json({ error: 'Error al verificar usuario' });
    }
  });

  // Register a new user with PIN
  router.post('/register', async (req, res) => {
    const client = await pool.connect();

    try {
      const { nickname, pin } = req.body;

      if (!nickname || nickname.trim().length < 2) {
        return res.status(400).json({ error: 'Nickname debe tener al menos 2 caracteres' });
      }

      if (nickname.length > 20) {
        return res.status(400).json({ error: 'Nickname debe tener máximo 20 caracteres' });
      }

      if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return res.status(400).json({ error: 'PIN debe ser de 4 dígitos' });
      }

      // Check if predictions are locked
      const settings = await client.query('SELECT predictions_locked FROM game_settings WHERE id = 1');
      if (settings.rows[0]?.predictions_locked) {
        return res.status(403).json({ error: 'Las predicciones están cerradas' });
      }

      // Check if nickname already exists
      const existing = await client.query(
        'SELECT id FROM users WHERE LOWER(nickname) = LOWER($1)',
        [nickname.trim()]
      );

      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Este nickname ya está registrado' });
      }

      await client.query('BEGIN');

      // Create user
      const pinHash = hashPin(pin);
      const result = await client.query(
        'INSERT INTO users (nickname, pin_hash) VALUES ($1, $2) RETURNING id, nickname, created_at',
        [nickname.trim(), pinHash]
      );

      const newUser = result.rows[0];

      // Initialize all 17 predictions with null answers
      for (let questionId = 1; questionId <= TOTAL_QUESTIONS; questionId++) {
        await client.query(
          'INSERT INTO predictions (user_id, question_id, answer) VALUES ($1, $2, NULL)',
          [newUser.id, questionId]
        );
      }

      await client.query('COMMIT');

      res.status(201).json(newUser);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error registering user:', error);
      res.status(500).json({ error: 'Error al registrar usuario' });
    } finally {
      client.release();
    }
  });

  // Login with nickname + PIN
  router.post('/login', async (req, res) => {
    const client = await pool.connect();

    try {
      const { nickname, pin } = req.body;

      if (!nickname || !pin) {
        return res.status(400).json({ error: 'Nickname y PIN son requeridos' });
      }

      const result = await client.query(
        'SELECT id, nickname, pin_hash, created_at FROM users WHERE LOWER(nickname) = LOWER($1)',
        [nickname.trim()]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const user = result.rows[0];

      // If user has no PIN (legacy user), set it now
      if (!user.pin_hash) {
        const pinHash = hashPin(pin);
        await client.query('UPDATE users SET pin_hash = $1 WHERE id = $2', [pinHash, user.id]);
      } else {
        // Verify PIN
        if (hashPin(pin) !== user.pin_hash) {
          return res.status(401).json({ error: 'PIN incorrecto' });
        }
      }

      // Ensure user has all 17 prediction records (for legacy users)
      const existingPredictions = await client.query(
        'SELECT COUNT(*) as count FROM predictions WHERE user_id = $1',
        [user.id]
      );

      if (parseInt(existingPredictions.rows[0].count) < TOTAL_QUESTIONS) {
        // Initialize missing predictions
        for (let questionId = 1; questionId <= TOTAL_QUESTIONS; questionId++) {
          await client.query(
            'INSERT INTO predictions (user_id, question_id, answer) VALUES ($1, $2, NULL) ON CONFLICT (user_id, question_id) DO NOTHING',
            [user.id, questionId]
          );
        }
      }

      res.json({ id: user.id, nickname: user.nickname, created_at: user.created_at });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ error: 'Error al iniciar sesión' });
    } finally {
      client.release();
    }
  });

  // Legacy: Register a new user (kept for backwards compatibility)
  router.post('/', async (req, res) => {
    const client = await pool.connect();

    try {
      const { nickname } = req.body;

      if (!nickname || nickname.trim().length < 2) {
        return res.status(400).json({ error: 'Nickname debe tener al menos 2 caracteres' });
      }

      if (nickname.length > 20) {
        return res.status(400).json({ error: 'Nickname debe tener máximo 20 caracteres' });
      }

      // Check if predictions are locked
      const settings = await client.query('SELECT predictions_locked FROM game_settings WHERE id = 1');
      if (settings.rows[0]?.predictions_locked) {
        return res.status(403).json({ error: 'Las predicciones están cerradas' });
      }

      await client.query('BEGIN');

      const result = await client.query(
        'INSERT INTO users (nickname) VALUES ($1) ON CONFLICT (nickname) DO UPDATE SET nickname = EXCLUDED.nickname RETURNING *',
        [nickname.trim()]
      );

      const newUser = result.rows[0];

      // Check if predictions already exist for this user
      const existingPredictions = await client.query(
        'SELECT COUNT(*) as count FROM predictions WHERE user_id = $1',
        [newUser.id]
      );

      // Only initialize predictions if none exist
      if (parseInt(existingPredictions.rows[0].count) === 0) {
        for (let questionId = 1; questionId <= TOTAL_QUESTIONS; questionId++) {
          await client.query(
            'INSERT INTO predictions (user_id, question_id, answer) VALUES ($1, $2, NULL) ON CONFLICT DO NOTHING',
            [newUser.id, questionId]
          );
        }
      }

      await client.query('COMMIT');

      res.status(201).json(newUser);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Error al registrar usuario' });
    } finally {
      client.release();
    }
  });

  // Get user by nickname
  router.get('/:nickname', async (req, res) => {
    try {
      const { nickname } = req.params;

      const result = await pool.query(
        'SELECT * FROM users WHERE nickname = $1',
        [nickname]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error getting user:', error);
      res.status(500).json({ error: 'Error al obtener usuario' });
    }
  });

  // Get all users count
  router.get('/', async (req, res) => {
    try {
      const result = await pool.query('SELECT COUNT(*) as count FROM users');
      res.json({ count: parseInt(result.rows[0].count) });
    } catch (error) {
      console.error('Error getting users count:', error);
      res.status(500).json({ error: 'Error al obtener conteo de usuarios' });
    }
  });

  return router;
}
