import { Router } from 'express';
import { calculateLeaderboard } from '../services/scoring.js';
import { addClient } from '../services/sse.js';

export default function leaderboardRouter(pool) {
  const router = Router();

  // Get leaderboard
  router.get('/', async (req, res) => {
    try {
      const startTime = Date.now();

      // Run all queries in parallel for better performance
      const [settingsResult, usersResult, answersResult] = await Promise.all([
        pool.query('SELECT * FROM game_settings WHERE id = 1'),
        pool.query(`
          SELECT u.id, u.nickname, u.created_at,
                 COALESCE(json_agg(
                   json_build_object('question_id', p.question_id, 'answer', p.answer)
                 ), '[]') as predictions
          FROM users u
          INNER JOIN predictions p ON u.id = p.user_id
          GROUP BY u.id, u.nickname, u.created_at
          HAVING COUNT(p.id) = 17
        `),
        pool.query('SELECT question_id, answer FROM correct_answers')
      ]);

      console.log(`DB queries took ${Date.now() - startTime}ms`);

      const settings = settingsResult.rows[0] || { responses_visible: false, predictions_locked: false };

      // Build correct answers map
      const correctAnswers = {};
      answersResult.rows.forEach(row => {
        correctAnswers[row.question_id] = row.answer;
      });

      const leaderboard = calculateLeaderboard(usersResult.rows, correctAnswers);

      res.json({
        leaderboard,
        settings: {
          responsesVisible: settings.responses_visible,
          predictionsLocked: settings.predictions_locked
        },
        correctAnswers: settings.responses_visible ? correctAnswers : {},
        totalParticipants: leaderboard.length,
        answeredQuestions: Object.keys(correctAnswers).length
      });
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      res.status(500).json({ error: 'Error al obtener leaderboard' });
    }
  });

  // SSE stream for real-time updates
  router.get('/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send initial connection message
    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected' })}\n\n`);

    // Add this client to the broadcast list
    addClient(res);

    // Keep connection alive with heartbeat
    const heartbeat = setInterval(() => {
      res.write(`event: heartbeat\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`);
    }, 30000);

    req.on('close', () => {
      clearInterval(heartbeat);
    });
  });

  // Get user's position in leaderboard
  router.get('/position/:userId', async (req, res) => {
    try {
      const { userId } = req.params;

      // Get all users with predictions
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

      // Get correct answers
      const answersResult = await pool.query('SELECT question_id, answer FROM correct_answers');
      const correctAnswers = {};
      answersResult.rows.forEach(row => {
        correctAnswers[row.question_id] = row.answer;
      });

      const leaderboard = calculateLeaderboard(usersResult.rows, correctAnswers);
      const userEntry = leaderboard.find(entry => entry.id === parseInt(userId));

      if (!userEntry) {
        return res.status(404).json({ error: 'Usuario no encontrado en el leaderboard' });
      }

      res.json(userEntry);
    } catch (error) {
      console.error('Error getting user position:', error);
      res.status(500).json({ error: 'Error al obtener posición' });
    }
  });

  return router;
}
