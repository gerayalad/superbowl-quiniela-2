import { Router } from 'express';

export default function predictionsRouter(pool) {
  const router = Router();

  // Save predictions (batch)
  router.post('/', async (req, res) => {
    const client = await pool.connect();

    try {
      const { userId, predictions } = req.body;

      if (!userId || !predictions || typeof predictions !== 'object') {
        return res.status(400).json({ error: 'userId y predictions son requeridos' });
      }

      // Check if predictions are locked
      const settings = await client.query('SELECT predictions_locked FROM game_settings WHERE id = 1');
      if (settings.rows[0]?.predictions_locked) {
        return res.status(403).json({ error: 'Las predicciones están cerradas' });
      }

      // Verify user exists
      const userCheck = await client.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      await client.query('BEGIN');

      // Insert or update predictions
      for (const [questionId, answer] of Object.entries(predictions)) {
        await client.query(
          `INSERT INTO predictions (user_id, question_id, answer)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, question_id)
           DO UPDATE SET answer = EXCLUDED.answer, created_at = NOW()`,
          [userId, parseInt(questionId), answer]
        );
      }

      await client.query('COMMIT');

      res.status(201).json({ success: true, message: 'Predicciones guardadas' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error saving predictions:', error);
      res.status(500).json({ error: 'Error al guardar predicciones' });
    } finally {
      client.release();
    }
  });

  // Get predictions for a user
  router.get('/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;

      const result = await pool.query(
        'SELECT question_id, answer FROM predictions WHERE user_id = $1',
        [userId]
      );

      // Convert to object format
      const predictions = {};
      result.rows.forEach(row => {
        predictions[row.question_id] = row.answer;
      });

      res.json(predictions);
    } catch (error) {
      console.error('Error getting predictions:', error);
      res.status(500).json({ error: 'Error al obtener predicciones' });
    }
  });

  // Check if user has completed all predictions
  router.get('/user/:userId/complete', async (req, res) => {
    try {
      const { userId } = req.params;
      const TOTAL_QUESTIONS = 17;

      const result = await pool.query(
        'SELECT COUNT(*) as count FROM predictions WHERE user_id = $1',
        [userId]
      );

      const count = parseInt(result.rows[0].count);
      res.json({
        complete: count >= TOTAL_QUESTIONS,
        count,
        total: TOTAL_QUESTIONS
      });
    } catch (error) {
      console.error('Error checking predictions:', error);
      res.status(500).json({ error: 'Error al verificar predicciones' });
    }
  });

  return router;
}
