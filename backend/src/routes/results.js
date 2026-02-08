import { Router } from 'express';

export default function resultsRouter(pool) {
  const router = Router();

  // Get distribution of answers per question (anonymous)
  router.get('/', async (req, res) => {
    try {
      // Count answers grouped by question_id and answer
      const result = await pool.query(
        `SELECT question_id, answer, COUNT(*) as count
         FROM predictions
         GROUP BY question_id, answer
         ORDER BY question_id, count DESC`
      );

      // Get total unique participants
      const participantsResult = await pool.query(
        'SELECT COUNT(DISTINCT user_id) as total FROM predictions'
      );
      const totalParticipants = parseInt(participantsResult.rows[0].total);

      // Build distributions object
      const distributions = {};

      result.rows.forEach(row => {
        const qId = row.question_id;
        if (!distributions[qId]) {
          distributions[qId] = { total: 0, options: {} };
        }
        const count = parseInt(row.count);
        distributions[qId].total += count;
        distributions[qId].options[row.answer] = { count, percentage: 0 };
      });

      // Calculate percentages
      Object.values(distributions).forEach(dist => {
        Object.values(dist.options).forEach(opt => {
          opt.percentage = dist.total > 0
            ? Math.round((opt.count / dist.total) * 1000) / 10
            : 0;
        });
      });

      res.json({ distributions, totalParticipants });
    } catch (error) {
      console.error('Error getting results distribution:', error);
      res.status(500).json({ error: 'Error al obtener distribución de resultados' });
    }
  });

  return router;
}
