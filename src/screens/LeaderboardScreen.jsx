import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Crown, Medal, Award, Star, Wifi, WifiOff,
  ChevronLeft, Ticket, RefreshCw, Users
} from 'lucide-react';
import { useSSE } from '../hooks/useSSE';
import { getLeaderboard } from '../services/api';
import { useSafari } from '../contexts/SafariContext';

const LeaderboardScreen = ({ user, onViewTicket, onBack }) => {
  const { shouldReduceEffects } = useSafari();
  const [leaderboard, setLeaderboard] = useState([]);
  const [settings, setSettings] = useState({ responsesVisible: false, predictionsLocked: false });
  const [correctAnswers, setCorrectAnswers] = useState({});
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);

  const handleSSEUpdate = useCallback((data) => {
    if (data.settingsUpdate) {
      setSettings(data.settingsUpdate);
    } else {
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
      if (data.correctAnswers) setCorrectAnswers(data.correctAnswers);
      if (data.answeredQuestions !== undefined) setAnsweredQuestions(data.answeredQuestions);
    }
  }, []);

  const { isConnected } = useSSE(handleSSEUpdate);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await getLeaderboard();

      setLeaderboard(data.leaderboard || []);
      setSettings(data.settings);
      setCorrectAnswers(data.correctAnswers || {});
      setAnsweredQuestions(data.answeredQuestions || 0);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Only fetch once on mount
  useEffect(() => {
    if (!hasFetched) {
      setHasFetched(true);
      fetchLeaderboard();
    }
  }, [hasFetched]);

  const getUserEntry = () => {
    return leaderboard.find(entry => entry.id === user?.id);
  };

  const userEntry = getUserEntry();

  const getPositionIcon = (position) => {
    switch (position) {
      case 1: return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2: return <Medal className="w-5 h-5 text-gray-300" />;
      case 3: return <Award className="w-5 h-5 text-orange-400" />;
      default: return <span className="text-white/50 font-mono text-sm">{position}</span>;
    }
  };

  const getPositionBg = (position) => {
    switch (position) {
      case 1: return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/30';
      case 2: return 'bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/30';
      case 3: return 'bg-gradient-to-r from-orange-500/20 to-orange-600/10 border-orange-500/30';
      default: return 'bg-white/5 border-white/10';
    }
  };

  // Safari: use reduced blur class
  const blurClass = shouldReduceEffects ? 'blur-xl' : 'blur-[100px]';

  return (
    <div className="min-h-screen bg-dark-900 relative overflow-hidden">
      {/* Background - reduced blur in Safari */}
      <div className="absolute inset-0 bg-gradient-to-b from-sb-magenta/5 via-transparent to-sb-purple/5" />
      <div className={`absolute top-1/4 -left-32 w-64 h-64 bg-sb-magenta/10 rounded-full ${blurClass}`} />
      <div className={`absolute bottom-1/4 -right-32 w-64 h-64 bg-sb-cyan/10 rounded-full ${blurClass}`} />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 glass-dark border-b border-white/5">
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={onBack}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>

              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-sb-magenta" />
                <span className="font-bold text-white">Leaderboard</span>
              </div>

              {/* Connection status */}
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30">
                    <Wifi className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-green-400">En vivo</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/30">
                    <WifiOff className="w-3 h-3 text-red-400" />
                    <span className="text-xs text-red-400">Desconectado</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-4">
          {/* Stats bar */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-white/60">
              <Users className="w-4 h-4" />
              <span>{leaderboard.length} participantes</span>
            </div>
            <div className="flex items-center gap-2 text-white/60">
              <Star className="w-4 h-4" />
              <span>{answeredQuestions}/17 preguntas</span>
            </div>
            <button
              onClick={fetchLeaderboard}
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 text-white/60 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* User's position card (if in leaderboard) */}
          {userEntry && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-gradient-to-r from-sb-magenta/20 to-sb-cyan/10
                        border-2 border-sb-magenta/30"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sb-magenta/30 flex items-center justify-center">
                    {getPositionIcon(userEntry.position)}
                  </div>
                  <div>
                    <div className="text-xs text-white/50">Tu posición</div>
                    <div className="font-bold text-white">{userEntry.nickname}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-sb-magenta">{userEntry.score}</div>
                  <div className="text-xs text-white/50">puntos</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Leaderboard list */}
          {loading && leaderboard.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-sb-magenta animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchLeaderboard}
                className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/50">No hay participantes aún</p>
              <p className="text-white/30 text-sm mt-2">
                Los participantes aparecerán cuando completen sus predicciones
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Safari: use simple divs without AnimatePresence for better performance */}
              {shouldReduceEffects ? (
                leaderboard.map((entry) => (
                  <div
                    key={entry.id}
                    className={`
                      p-3 rounded-xl border transition-all
                      ${getPositionBg(entry.position)}
                      ${entry.id === user?.id ? 'ring-2 ring-sb-magenta' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {/* Position */}
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                        {getPositionIcon(entry.position)}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold truncate ${entry.id === user?.id ? 'text-sb-magenta' : 'text-white'}`}>
                          {entry.nickname}
                          {entry.id === user?.id && <span className="text-xs ml-2 text-white/50">(tú)</span>}
                        </div>
                        <div className="text-xs text-white/40 flex items-center gap-2">
                          <span>{entry.correctCount} aciertos</span>
                          <span className={entry.answeredCount < 17 ? 'text-yellow-400' : 'text-white/30'}>
                            {entry.answeredCount}/17
                          </span>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <div className={`text-xl font-bold ${
                          entry.position === 1 ? 'text-yellow-400' :
                          entry.position === 2 ? 'text-gray-300' :
                          entry.position === 3 ? 'text-orange-400' :
                          'text-white'
                        }`}>
                          {entry.score}
                        </div>
                        <div className="text-xs text-white/40">pts</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <AnimatePresence>
                  {leaderboard.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`
                        p-3 rounded-xl border transition-all
                        ${getPositionBg(entry.position)}
                        ${entry.id === user?.id ? 'ring-2 ring-sb-magenta' : ''}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        {/* Position */}
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                          {getPositionIcon(entry.position)}
                        </div>

                        {/* Name */}
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold truncate ${entry.id === user?.id ? 'text-sb-magenta' : 'text-white'}`}>
                            {entry.nickname}
                            {entry.id === user?.id && <span className="text-xs ml-2 text-white/50">(tú)</span>}
                          </div>
                          <div className="text-xs text-white/40">
                            {entry.correctCount} aciertos
                          </div>
                        </div>

                        {/* Score */}
                        <div className="text-right">
                          <div className={`text-xl font-bold ${
                            entry.position === 1 ? 'text-yellow-400' :
                            entry.position === 2 ? 'text-gray-300' :
                            entry.position === 3 ? 'text-orange-400' :
                            'text-white'
                          }`}>
                            {entry.score}
                          </div>
                          <div className="text-xs text-white/40">pts</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          )}

          {/* View ticket button */}
          {onViewTicket && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={onViewTicket}
              className="w-full py-4 px-6 rounded-xl font-semibold text-white
                       bg-gradient-to-r from-sb-magenta/20 to-sb-cyan/20
                       border border-sb-magenta/30 hover:border-sb-magenta/50
                       transition-all flex items-center justify-center gap-3"
            >
              <Ticket className="w-5 h-5" />
              Ver Mi Ticket
            </motion.button>
          )}
        </main>
      </div>
    </div>
  );
};

export default LeaderboardScreen;
