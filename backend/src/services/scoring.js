// Scoring service for calculating points

// Question 14 (index 14, id 14) is worth 2 points (Super Bowl winner)
const DOUBLE_POINT_QUESTION_ID = 14;

export function calculateScore(predictions, correctAnswers) {
  let score = 0;

  for (const [questionId, userAnswer] of Object.entries(predictions)) {
    const correctAnswer = correctAnswers[questionId];

    if (correctAnswer && userAnswer === correctAnswer) {
      // Question 14 (winner) is worth 20 points, others worth 10
      if (parseInt(questionId) === DOUBLE_POINT_QUESTION_ID) {
        score += 20;
      } else {
        score += 10;
      }
    }
  }

  return score;
}

export function calculateLeaderboard(users, correctAnswers) {
  const leaderboard = users.map(user => {
    const predictions = {};

    // Convert array of predictions to object
    user.predictions.forEach(p => {
      predictions[p.question_id] = p.answer;
    });

    const score = calculateScore(predictions, correctAnswers);

    // Count only non-null answers
    const answeredCount = user.predictions.filter(p => p.answer !== null).length;

    return {
      id: user.id,
      nickname: user.nickname,
      score,
      completedAt: user.created_at,
      correctCount: Object.keys(correctAnswers).filter(qId =>
        predictions[qId] === correctAnswers[qId]
      ).length,
      answeredCount,
      totalPredictions: user.predictions.length
    };
  });

  // Sort by score (desc), then by completion time (asc) for tiebreaker
  leaderboard.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // Tiebreaker: who completed predictions first
    return new Date(a.completedAt) - new Date(b.completedAt);
  });

  // Add position
  return leaderboard.map((entry, index) => ({
    ...entry,
    position: index + 1
  }));
}
