// API service for backend communication

const API_URL = import.meta.env.VITE_API_URL || '';

async function fetchApi(endpoint, options = {}) {
  const url = `${API_URL}/api${endpoint}`;

  const { headers: optionHeaders, ...restOptions } = options;

  const config = {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...optionHeaders,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error en la petición');
  }

  return response.json();
}

// Users
export async function checkNickname(nickname) {
  return fetchApi('/users/check', {
    method: 'POST',
    body: JSON.stringify({ nickname }),
  });
}

export async function registerUser(nickname, pin) {
  return fetchApi('/users/register', {
    method: 'POST',
    body: JSON.stringify({ nickname, pin }),
  });
}

export async function loginUser(nickname, pin) {
  return fetchApi('/users/login', {
    method: 'POST',
    body: JSON.stringify({ nickname, pin }),
  });
}

export async function getUser(nickname) {
  return fetchApi(`/users/${encodeURIComponent(nickname)}`);
}

export async function getUsersCount() {
  return fetchApi('/users');
}

// Predictions
export async function savePredictions(userId, predictions) {
  return fetchApi('/predictions', {
    method: 'POST',
    body: JSON.stringify({ userId, predictions }),
  });
}

export async function getUserPredictions(userId) {
  return fetchApi(`/predictions/user/${userId}`);
}

export async function checkPredictionsComplete(userId) {
  return fetchApi(`/predictions/user/${userId}/complete`);
}

// Leaderboard
export async function getLeaderboard() {
  return fetchApi('/leaderboard');
}

export async function getUserPosition(userId) {
  return fetchApi(`/leaderboard/position/${userId}`);
}

// Settings
export async function getSettings() {
  return fetchApi('/settings');
}

// Public correct answers (only returns data when answersVisible is true)
export async function getPublicCorrectAnswers() {
  return fetchApi('/answers');
}

// Admin
export async function verifyAdminPin(pin) {
  return fetchApi('/admin/verify', {
    method: 'POST',
    body: JSON.stringify({ pin }),
  });
}

export async function getAdminSettings(pin) {
  return fetchApi('/admin/settings', {
    headers: { 'x-admin-pin': pin },
  });
}

export async function updateAdminSettings(pin, settings) {
  return fetchApi('/admin/settings', {
    method: 'PUT',
    headers: { 'x-admin-pin': pin },
    body: JSON.stringify(settings),
  });
}

export async function markCorrectAnswer(pin, questionId, answer) {
  console.log('API markCorrectAnswer:', { questionId, answer, body: JSON.stringify({ answer }) });
  return fetchApi(`/admin/answers/${questionId}`, {
    method: 'POST',
    headers: { 'x-admin-pin': pin },
    body: JSON.stringify({ answer }),
  });
}

export async function removeCorrectAnswer(pin, questionId) {
  return fetchApi(`/admin/answers/${questionId}`, {
    method: 'DELETE',
    headers: { 'x-admin-pin': pin },
  });
}

export async function getCorrectAnswers(pin) {
  return fetchApi('/admin/answers', {
    headers: { 'x-admin-pin': pin },
  });
}

export async function getParticipants(pin) {
  return fetchApi('/admin/participants', {
    headers: { 'x-admin-pin': pin },
  });
}

export async function deleteUser(pin, userId) {
  return fetchApi(`/admin/users/${userId}`, {
    method: 'DELETE',
    headers: { 'x-admin-pin': pin },
  });
}

export async function resetUserPin(pin, userId, newPin) {
  return fetchApi(`/admin/users/${userId}/reset-pin`, {
    method: 'POST',
    headers: { 'x-admin-pin': pin },
    body: JSON.stringify({ newPin }),
  });
}

// SSE stream URL
export function getLeaderboardStreamUrl() {
  return `${API_URL}/api/leaderboard/stream`;
}
