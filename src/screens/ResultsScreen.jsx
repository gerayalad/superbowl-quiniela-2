import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, ChevronLeft, RefreshCw, Users,
  Flag, Target, Music, Trophy, Star
} from 'lucide-react';
import { getResultsDistribution } from '../services/api';
import { questions } from '../data/questions';
import { useSafari } from '../contexts/SafariContext';

const ResultsScreen = ({ onBack }) => {
  const { shouldReduceEffects } = useSafari();
  const [distributions, setDistributions] = useState({});
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const data = await getResultsDistribution();
      setDistributions(data.distributions || {});
      setTotalParticipants(data.totalParticipants || 0);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'pregame': return <Flag className="w-4 h-4" />;
      case 'game': return <Target className="w-4 h-4" />;
      case 'halftime': return <Music className="w-4 h-4" />;
      case 'final': return <Trophy className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'pregame': return 'Pre-Juego';
      case 'game': return 'Partido';
      case 'halftime': return 'Medio Tiempo';
      case 'final': return 'Final';
      default: return '';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'pregame': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'game': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'halftime': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'final': return 'bg-sb-magenta/20 text-sb-magenta border-sb-magenta/30';
      default: return 'bg-white/10 text-white/60 border-white/20';
    }
  };

  // Group questions by category
  const groupedQuestions = questions.reduce((acc, q) => {
    if (!acc[q.category]) acc[q.category] = [];
    acc[q.category].push(q);
    return acc;
  }, {});

  const categoryOrder = ['pregame', 'game', 'halftime', 'final'];

  // Find the majority option for a question
  const getMajorityOption = (questionDist) => {
    if (!questionDist?.options) return null;
    let maxCount = 0;
    let majorityKey = null;
    Object.entries(questionDist.options).forEach(([key, val]) => {
      if (val.count > maxCount) {
        maxCount = val.count;
        majorityKey = key;
      }
    });
    return majorityKey;
  };

  // Safari: use reduced blur class
  const blurClass = shouldReduceEffects ? 'blur-xl' : 'blur-[100px]';

  return (
    <div className="min-h-screen bg-dark-900 relative overflow-hidden">
      {/* Background */}
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
                <BarChart3 className="w-5 h-5 text-sb-magenta" />
                <span className="font-bold text-white">Resultados del Grupo</span>
              </div>

              <button
                onClick={fetchResults}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 text-white/60 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-4">
          {/* Stats card */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-white/60 text-sm"
          >
            <Users className="w-4 h-4" />
            <span>{totalParticipants} participantes</span>
          </motion.div>

          {/* Loading */}
          {loading && Object.keys(distributions).length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-sb-magenta animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchResults}
                className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : (
            /* Questions grouped by category */
            categoryOrder.map((category, catIndex) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: catIndex * 0.1 }}
              >
                {/* Category header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getCategoryColor(category)}`}>
                    {getCategoryIcon(category)}
                    {getCategoryLabel(category)}
                  </span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <div className="space-y-3">
                  {groupedQuestions[category]?.map((q, qIndex) => {
                    const dist = distributions[q.id] || distributions[String(q.id)];
                    const majorityOption = getMajorityOption(dist);

                    return (
                      <div
                        key={q.id}
                        className="rounded-2xl bg-gradient-to-br from-white/[0.07] to-white/[0.03]
                                  backdrop-blur-xl border border-white/10 p-4"
                      >
                        {/* Question text */}
                        <p className="text-white font-medium text-sm mb-3 leading-snug">
                          {q.question}
                        </p>

                        {/* Options with bars */}
                        <div className="space-y-2">
                          {q.options.map((option) => {
                            const optionData = dist?.options?.[option];
                            const percentage = optionData?.percentage || 0;
                            const count = optionData?.count || 0;
                            const isMajority = option === majorityOption && count > 0;

                            return (
                              <div key={option} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className={`${isMajority ? 'text-white font-semibold' : 'text-white/60'}`}>
                                    {option}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className={`${isMajority ? 'text-white font-semibold' : 'text-white/40'}`}>
                                      {count}
                                    </span>
                                    <span className={`font-mono ${isMajority ? 'text-sb-magenta font-bold' : 'text-white/50'}`}>
                                      {percentage}%
                                    </span>
                                  </div>
                                </div>

                                {/* Progress bar */}
                                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                  {shouldReduceEffects ? (
                                    <div
                                      className={`h-full rounded-full ${
                                        isMajority
                                          ? 'bg-gradient-to-r from-sb-magenta to-sb-cyan'
                                          : 'bg-white/20'
                                      }`}
                                      style={{ width: `${percentage}%` }}
                                    />
                                  ) : (
                                    <motion.div
                                      className={`h-full rounded-full ${
                                        isMajority
                                          ? 'bg-gradient-to-r from-sb-magenta to-sb-cyan'
                                          : 'bg-white/20'
                                      }`}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${percentage}%` }}
                                      transition={{ duration: 0.8, delay: catIndex * 0.1 + qIndex * 0.05, ease: 'easeOut' }}
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))
          )}

          {/* Bottom spacing */}
          <div className="h-6" />
        </main>
      </div>
    </div>
  );
};

export default ResultsScreen;
