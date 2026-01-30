import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Lock, Unlock, Eye, EyeOff, Check, X,
  ChevronLeft, ChevronDown, ChevronUp, Users, RefreshCw,
  AlertCircle, Trophy, Trash2, KeyRound
} from 'lucide-react';
import {
  verifyAdminPin, getAdminSettings, updateAdminSettings,
  markCorrectAnswer, removeCorrectAnswer, getCorrectAnswers,
  getParticipants, deleteUser, resetUserPin
} from '../services/api';
import { questions } from '../data/questions';
import { useSSE } from '../hooks/useSSE';

const AdminScreen = ({ onBack }) => {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    responsesVisible: false,
    predictionsLocked: false
  });

  // Answers state
  const [correctAnswers, setCorrectAnswers] = useState({});
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  // Participants
  const [participants, setParticipants] = useState([]);
  const [showParticipants, setShowParticipants] = useState(false);

  // User management modals
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToResetPin, setUserToResetPin] = useState(null);
  const [newPin, setNewPin] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Status messages
  const [statusMessage, setStatusMessage] = useState(null);

  const showStatus = (message, type = 'success') => {
    setStatusMessage({ message, type });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // SSE for real-time updates
  useSSE(useCallback((data) => {
    if (data.settingsUpdate) {
      setSettings(data.settingsUpdate);
    }
    if (data.correctAnswers) {
      // Handle both formats
      const answers = {};
      Object.entries(data.correctAnswers).forEach(([qId, value]) => {
        if (typeof value === 'string') {
          answers[qId] = value;
        } else if (value && typeof value === 'object' && value.answer) {
          answers[qId] = value.answer;
        }
      });
      setCorrectAnswers(answers);
    }
  }, []));

  const handleLogin = async () => {
    if (!pin || pin.length !== 4) {
      setAuthError('Ingresa un PIN de 4 dígitos');
      return;
    }

    setLoading(true);
    setAuthError('');

    try {
      await verifyAdminPin(pin);
      setIsAuthenticated(true);

      // Load initial data
      const [settingsData, answersData, participantsData] = await Promise.all([
        getAdminSettings(pin),
        getCorrectAnswers(pin),
        getParticipants(pin)
      ]);

      setSettings(settingsData);

      // Convert answers format - handle both formats
      const answers = {};
      Object.entries(answersData).forEach(([qId, data]) => {
        // Handle both { "1": { answer: "X" } } and { "1": "X" } formats
        if (typeof data === 'string') {
          answers[qId] = data;
        } else if (data && typeof data === 'object' && data.answer) {
          answers[qId] = data.answer;
        }
      });
      setCorrectAnswers(answers);
      console.log('Loaded correct answers:', answers);

      setParticipants(participantsData);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSetting = async (setting) => {
    try {
      const newSettings = {
        ...settings,
        [setting]: !settings[setting]
      };

      await updateAdminSettings(pin, {
        [setting === 'responsesVisible' ? 'responsesVisible' : 'predictionsLocked']:
          newSettings[setting]
      });

      setSettings(newSettings);
      showStatus(`${setting === 'responsesVisible' ? 'Visibilidad' : 'Predicciones'} actualizado`);
    } catch (error) {
      showStatus(error.message, 'error');
    }
  };

  const handleMarkAnswer = async (questionId, answer) => {
    console.log('Marking answer:', { questionId, answer, pin });
    try {
      await markCorrectAnswer(pin, questionId, answer);
      setCorrectAnswers(prev => ({ ...prev, [questionId]: answer }));
      showStatus(`Pregunta ${questionId} marcada correctamente`);
      setExpandedQuestion(null);
    } catch (error) {
      console.error('Error marking answer:', error);
      showStatus(error.message, 'error');
    }
  };

  const handleRemoveAnswer = async (questionId) => {
    try {
      await removeCorrectAnswer(pin, questionId);
      setCorrectAnswers(prev => {
        const newAnswers = { ...prev };
        delete newAnswers[questionId];
        return newAnswers;
      });
      showStatus(`Respuesta de pregunta ${questionId} eliminada`);
    } catch (error) {
      showStatus(error.message, 'error');
    }
  };

  const refreshParticipants = async () => {
    try {
      const data = await getParticipants(pin);
      setParticipants(data);
    } catch (error) {
      showStatus(error.message, 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setActionLoading(true);
    try {
      await deleteUser(pin, userToDelete.id);
      setParticipants(prev => prev.filter(p => p.id !== userToDelete.id));
      showStatus(`Usuario "${userToDelete.nickname}" eliminado`);
      setUserToDelete(null);
    } catch (error) {
      showStatus(error.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPin = async () => {
    if (!userToResetPin || newPin.length !== 4) return;

    setActionLoading(true);
    try {
      await resetUserPin(pin, userToResetPin.id, newPin);
      showStatus(`PIN de "${userToResetPin.nickname}" reiniciado`);
      setUserToResetPin(null);
      setNewPin('');
    } catch (error) {
      showStatus(error.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'pregame': return 'text-blue-400 bg-blue-500/20';
      case 'game': return 'text-orange-400 bg-orange-500/20';
      case 'halftime': return 'text-purple-400 bg-purple-500/20';
      case 'final': return 'text-sb-magenta bg-sb-magenta/20';
      default: return 'text-white/60 bg-white/10';
    }
  };

  // PIN Entry Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-b from-sb-magenta/5 via-transparent to-sb-purple/5" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-sm"
        >
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sb-magenta/20 border border-sb-magenta/30
                            flex items-center justify-center">
                <Shield className="w-8 h-8 text-sb-magenta" />
              </div>
              <h2 className="text-xl font-bold text-white">Panel de Admin</h2>
              <p className="text-white/50 text-sm mt-1">Ingresa el PIN de administrador</p>
            </div>

            <div className="space-y-4">
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="••••"
                className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10
                         text-white text-center text-2xl tracking-[0.5em] placeholder-white/30
                         focus:outline-none focus:border-sb-magenta focus:ring-2 focus:ring-sb-magenta/20"
              />

              {authError && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-sm text-center flex items-center justify-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  {authError}
                </motion.p>
              )}

              <button
                onClick={handleLogin}
                disabled={loading || pin.length !== 4}
                className="w-full py-4 rounded-xl font-bold text-white
                         bg-gradient-to-r from-sb-magenta to-sb-fuchsia
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all hover:shadow-lg hover:shadow-sb-magenta/30"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 mx-auto animate-spin" />
                ) : (
                  'Entrar'
                )}
              </button>

              <button
                onClick={onBack}
                className="w-full py-3 rounded-xl text-white/60 hover:text-white
                         hover:bg-white/5 transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Volver
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-dark-900 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-sb-magenta/5 via-transparent to-sb-purple/5" />

      {/* Status message toast */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl
                      ${statusMessage.type === 'error' ? 'bg-red-500/90' : 'bg-green-500/90'}
                      text-white font-medium shadow-lg`}
          >
            {statusMessage.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete User Modal */}
      <AnimatePresence>
        {userToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/70"
              onClick={() => setUserToDelete(null)}
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm p-6 rounded-2xl bg-dark-800 border border-white/10"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 border border-red-500/30
                              flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">¿Eliminar usuario?</h3>
                <p className="text-white/60 text-sm mb-6">
                  Se eliminará a <span className="font-bold text-white">{userToDelete.nickname}</span> y todas sus predicciones. Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setUserToDelete(null)}
                    className="flex-1 py-3 rounded-xl font-medium text-white/70
                             bg-white/10 hover:bg-white/15 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteUser}
                    disabled={actionLoading}
                    className="flex-1 py-3 rounded-xl font-bold text-white
                             bg-red-500 hover:bg-red-600 transition-colors
                             disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset PIN Modal */}
      <AnimatePresence>
        {userToResetPin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/70"
              onClick={() => { setUserToResetPin(null); setNewPin(''); }}
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm p-6 rounded-2xl bg-dark-800 border border-white/10"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 border border-blue-500/30
                              flex items-center justify-center">
                  <KeyRound className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Reiniciar PIN</h3>
                <p className="text-white/60 text-sm mb-4">
                  Ingresa el nuevo PIN para <span className="font-bold text-white">{userToResetPin.nickname}</span>
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10
                           text-white text-center text-2xl tracking-[0.5em] placeholder-white/30
                           focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 mb-6"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => { setUserToResetPin(null); setNewPin(''); }}
                    className="flex-1 py-3 rounded-xl font-medium text-white/70
                             bg-white/10 hover:bg-white/15 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleResetPin}
                    disabled={actionLoading || newPin.length !== 4}
                    className="flex-1 py-3 rounded-xl font-bold text-white
                             bg-blue-500 hover:bg-blue-600 transition-colors
                             disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Guardar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 glass-dark border-b border-white/5">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-sb-magenta" />
              <span className="font-bold text-white">Admin Panel</span>
            </div>
            <div className="w-9" />
          </div>
        </header>

        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
          {/* Controls Section */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Controles</h3>

            {/* Responses Visible Toggle */}
            <button
              onClick={() => handleToggleSetting('responsesVisible')}
              className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between
                        ${settings.responsesVisible
                          ? 'bg-green-500/20 border-green-500/30'
                          : 'bg-white/5 border-white/10'}`}
            >
              <div className="flex items-center gap-3">
                {settings.responsesVisible ? (
                  <Eye className="w-5 h-5 text-green-400" />
                ) : (
                  <EyeOff className="w-5 h-5 text-white/50" />
                )}
                <div className="text-left">
                  <div className="font-medium text-white">Respuestas Visibles</div>
                  <div className="text-xs text-white/50">
                    {settings.responsesVisible ? 'Los usuarios pueden ver las respuestas correctas' : 'Las respuestas están ocultas'}
                  </div>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors ${settings.responsesVisible ? 'bg-green-500' : 'bg-white/20'}`}>
                <motion.div
                  className="w-5 h-5 rounded-full bg-white shadow mt-0.5"
                  animate={{ x: settings.responsesVisible ? 26 : 2 }}
                />
              </div>
            </button>

            {/* Predictions Locked Toggle */}
            <button
              onClick={() => handleToggleSetting('predictionsLocked')}
              className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between
                        ${settings.predictionsLocked
                          ? 'bg-red-500/20 border-red-500/30'
                          : 'bg-white/5 border-white/10'}`}
            >
              <div className="flex items-center gap-3">
                {settings.predictionsLocked ? (
                  <Lock className="w-5 h-5 text-red-400" />
                ) : (
                  <Unlock className="w-5 h-5 text-white/50" />
                )}
                <div className="text-left">
                  <div className="font-medium text-white">Bloquear Predicciones</div>
                  <div className="text-xs text-white/50">
                    {settings.predictionsLocked ? 'No se pueden hacer más predicciones' : 'Las predicciones están abiertas'}
                  </div>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors ${settings.predictionsLocked ? 'bg-red-500' : 'bg-white/20'}`}>
                <motion.div
                  className="w-5 h-5 rounded-full bg-white shadow mt-0.5"
                  animate={{ x: settings.predictionsLocked ? 26 : 2 }}
                />
              </div>
            </button>
          </section>

          {/* Participants Section */}
          <section className="space-y-3">
            <button
              onClick={() => {
                setShowParticipants(!showParticipants);
                if (!showParticipants) refreshParticipants();
              }}
              className="w-full flex items-center justify-between"
            >
              <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4" />
                Participantes ({participants.length})
              </h3>
              {showParticipants ? (
                <ChevronUp className="w-4 h-4 text-white/50" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white/50" />
              )}
            </button>

            <AnimatePresence>
              {showParticipants && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-2"
                >
                  {participants.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white">{p.nickname}</div>
                          <div className="text-xs text-white/40">
                            {p.predictions.length} predicciones
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {p.predictions.length === 17 && (
                            <Check className="w-5 h-5 text-green-400" />
                          )}
                        </div>
                      </div>
                      {/* Action buttons */}
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                        <button
                          onClick={() => setUserToResetPin(p)}
                          className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium
                                   bg-blue-500/20 text-blue-400 hover:bg-blue-500/30
                                   flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          Reiniciar PIN
                        </button>
                        <button
                          onClick={() => setUserToDelete(p)}
                          className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium
                                   bg-red-500/20 text-red-400 hover:bg-red-500/30
                                   flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Mark Answers Section */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Marcar Respuestas ({Object.keys(correctAnswers).length}/17)
            </h3>

            <div className="space-y-2">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className={`rounded-xl border overflow-hidden transition-all
                            ${correctAnswers[q.id] ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}
                >
                  <button
                    onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                    className="w-full p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getCategoryColor(q.category)}`}>
                        {q.id}
                      </span>
                      <span className="text-sm text-white text-left truncate max-w-[200px]">
                        {q.question}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {correctAnswers[q.id] && (
                        <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full truncate max-w-[80px]">
                          {correctAnswers[q.id]}
                        </span>
                      )}
                      {expandedQuestion === q.id ? (
                        <ChevronUp className="w-4 h-4 text-white/50" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-white/50" />
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedQuestion === q.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            {q.options.map((option) => (
                              <button
                                key={option}
                                onClick={() => handleMarkAnswer(q.id, option)}
                                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all
                                          ${correctAnswers[q.id] === option
                                            ? 'bg-green-500 text-white'
                                            : 'bg-white/10 text-white hover:bg-white/20'}`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                          {correctAnswers[q.id] && (
                            <button
                              onClick={() => handleRemoveAnswer(q.id)}
                              className="w-full py-2 rounded-lg text-sm text-red-400 bg-red-500/10
                                       hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Quitar respuesta
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default AdminScreen;
