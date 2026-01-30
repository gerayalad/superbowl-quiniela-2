import { Router } from 'express';
import { verifyAdminPin, checkAdminPin } from '../middleware/adminAuth.js';
import { broadcast } from '../services/sse.js';
import { calculateLeaderboard } from '../services/scoring.js';

export default function adminRouter(pool) {
  const router = Router();

  // Verify PIN (for login)
  router.post('/verify', (req, res) => {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({ error: 'PIN requerido' });
    }

    if (checkAdminPin(pin)) {
      res.json({ success: true, message: 'PIN correcto' });
    } else {
      res.status(403).json({ error: 'PIN incorrecto' });
    }
  });

  // Get current settings
  router.get('/settings', verifyAdminPin, async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM game_settings WHERE id = 1');
      const settings = result.rows[0] || { responses_visible: false, predictions_locked: false };

      res.json({
        responsesVisible: settings.responses_visible,
        predictionsLocked: settings.predictions_locked
      });
    } catch (error) {
      console.error('Error getting settings:', error);
      res.status(500).json({ error: 'Error al obtener configuración' });
    }
  });

  // Update settings
  router.put('/settings', verifyAdminPin, async (req, res) => {
    try {
      const { responsesVisible, predictionsLocked } = req.body;

      const result = await pool.query(
        `UPDATE game_settings
         SET responses_visible = COALESCE($1, responses_visible),
             predictions_locked = COALESCE($2, predictions_locked)
         WHERE id = 1
         RETURNING *`,
        [responsesVisible, predictionsLocked]
      );

      const settings = result.rows[0];

      // Broadcast settings change
      broadcast('settings-update', {
        responsesVisible: settings.responses_visible,
        predictionsLocked: settings.predictions_locked
      });

      res.json({
        responsesVisible: settings.responses_visible,
        predictionsLocked: settings.predictions_locked
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ error: 'Error al actualizar configuración' });
    }
  });

  // Mark correct answer for a question
  router.post('/answers/:questionId', (req, res, next) => {
    console.log('=== BEFORE AUTH ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Raw body type:', typeof req.body);
    next();
  }, verifyAdminPin, async (req, res) => {
    try {
      const { questionId } = req.params;
      const { answer } = req.body;

      console.log('=== AFTER AUTH ===');
      console.log('POST /answers/:questionId - Received:', { questionId, body: req.body, answer });

      if (!answer) {
        console.log('Error: answer is missing or empty');
        return res.status(400).json({ error: 'Respuesta requerida' });
      }

      await pool.query(
        `INSERT INTO correct_answers (question_id, answer, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (question_id)
         DO UPDATE SET answer = EXCLUDED.answer, updated_at = NOW()`,
        [parseInt(questionId), answer]
      );

      // Get updated leaderboard to broadcast
      const usersResult = await pool.query(`
        SELECT u.id, u.nickname, u.created_at,
               COALESCE(json_agg(
                 json_build_object('question_id', p.question_id, 'answer', p.answer)
               ) FILTER (WHERE p.id IS NOT NULL), '[]') as predictions
        FROM users u
        LEFT JOIN predictions p ON u.id = p.user_id
        GROUP BY u.id, u.nickname, u.created_at
        HAVING COUNT(p.id) = 17
      `);

      const answersResult = await pool.query('SELECT question_id, answer FROM correct_answers');
      const correctAnswers = {};
      answersResult.rows.forEach(row => {
        correctAnswers[row.question_id] = row.answer;
      });

      const leaderboard = calculateLeaderboard(usersResult.rows, correctAnswers);

      // Broadcast leaderboard update
      broadcast('leaderboard-update', {
        leaderboard,
        correctAnswers,
        answeredQuestions: Object.keys(correctAnswers).length,
        updatedQuestion: parseInt(questionId)
      });

      res.json({
        success: true,
        questionId: parseInt(questionId),
        answer
      });
    } catch (error) {
      console.error('Error marking answer:', error);
      res.status(500).json({ error: 'Error al marcar respuesta' });
    }
  });

  // Remove correct answer for a question
  router.delete('/answers/:questionId', verifyAdminPin, async (req, res) => {
    try {
      const { questionId } = req.params;

      await pool.query('DELETE FROM correct_answers WHERE question_id = $1', [parseInt(questionId)]);

      // Get updated leaderboard to broadcast
      const usersResult = await pool.query(`
        SELECT u.id, u.nickname, u.created_at,
               COALESCE(json_agg(
                 json_build_object('question_id', p.question_id, 'answer', p.answer)
               ) FILTER (WHERE p.id IS NOT NULL), '[]') as predictions
        FROM users u
        LEFT JOIN predictions p ON u.id = p.user_id
        GROUP BY u.id, u.nickname, u.created_at
        HAVING COUNT(p.id) = 17
      `);

      const answersResult = await pool.query('SELECT question_id, answer FROM correct_answers');
      const correctAnswers = {};
      answersResult.rows.forEach(row => {
        correctAnswers[row.question_id] = row.answer;
      });

      const leaderboard = calculateLeaderboard(usersResult.rows, correctAnswers);

      // Broadcast leaderboard update
      broadcast('leaderboard-update', {
        leaderboard,
        correctAnswers,
        answeredQuestions: Object.keys(correctAnswers).length,
        updatedQuestion: parseInt(questionId)
      });

      res.json({ success: true, questionId: parseInt(questionId) });
    } catch (error) {
      console.error('Error removing answer:', error);
      res.status(500).json({ error: 'Error al eliminar respuesta' });
    }
  });

  // Get all correct answers
  router.get('/answers', verifyAdminPin, async (req, res) => {
    try {
      const result = await pool.query('SELECT question_id, answer, updated_at FROM correct_answers ORDER BY question_id');

      const answers = {};
      result.rows.forEach(row => {
        answers[row.question_id] = {
          answer: row.answer,
          updatedAt: row.updated_at
        };
      });

      res.json(answers);
    } catch (error) {
      console.error('Error getting answers:', error);
      res.status(500).json({ error: 'Error al obtener respuestas' });
    }
  });

  // Get all participants with their predictions
  router.get('/participants', verifyAdminPin, async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT u.id, u.nickname, u.created_at,
               COALESCE(json_agg(
                 json_build_object('question_id', p.question_id, 'answer', p.answer)
                 ORDER BY p.question_id
               ) FILTER (WHERE p.id IS NOT NULL), '[]') as predictions
        FROM users u
        LEFT JOIN predictions p ON u.id = p.user_id
        GROUP BY u.id, u.nickname, u.created_at
        ORDER BY u.created_at DESC
      `);

      res.json(result.rows);
    } catch (error) {
      console.error('Error getting participants:', error);
      res.status(500).json({ error: 'Error al obtener participantes' });
    }
  });

  // Delete a user and their predictions
  router.delete('/users/:userId', verifyAdminPin, async (req, res) => {
    const client = await pool.connect();
    try {
      const { userId } = req.params;

      await client.query('BEGIN');

      // Delete user's predictions first (foreign key constraint)
      await client.query('DELETE FROM predictions WHERE user_id = $1', [userId]);

      // Delete the user
      const result = await client.query('DELETE FROM users WHERE id = $1 RETURNING nickname', [userId]);

      if (result.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      await client.query('COMMIT');

      res.json({ success: true, nickname: result.rows[0].nickname });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Error al eliminar usuario' });
    } finally {
      client.release();
    }
  });

  // Reset user PIN
  router.post('/users/:userId/reset-pin', verifyAdminPin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { newPin } = req.body;

      if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        return res.status(400).json({ error: 'PIN debe ser de 4 dígitos' });
      }

      const result = await pool.query(
        'UPDATE users SET pin = $1 WHERE id = $2 RETURNING nickname',
        [newPin, userId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json({ success: true, nickname: result.rows[0].nickname });
    } catch (error) {
      console.error('Error resetting PIN:', error);
      res.status(500).json({ error: 'Error al reiniciar PIN' });
    }
  });

  return router;
}
