import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Users, DollarSign, ChevronRight, ChevronLeft,
  X, Check, Info, Sparkles, Zap, Star, Crown, Gift,
  Music, Flag, Target, Clock, Award, Copy, Shield, Ticket, LogOut
} from 'lucide-react';
import { questions, eventInfo, rules } from './data/questions';
import LeaderboardScreen from './screens/LeaderboardScreen';
import AdminScreen from './screens/AdminScreen';
import { checkNickname, registerUser, loginUser, savePredictions, getUserPredictions, getSettings, getPublicCorrectAnswers } from './services/api';
import { useSafari } from './contexts/SafariContext';

// ============================================
// UTILITY HOOKS
// ============================================

const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

const useAnimatedNumber = (endValue) => {
  const ref = useRef(null);
  const [displayValue, setDisplayValue] = useState(endValue);

  useEffect(() => {
    // Use CSS-based animation to avoid re-renders
    // Simply update the display value without animation frame loop
    setDisplayValue(endValue);
  }, [endValue]);

  return displayValue;
};

// ============================================
// UI COMPONENTS
// ============================================

const ParticleField = () => {
  const { shouldReduceEffects } = useSafari();
  const particleCount = shouldReduceEffects ? 8 : 25;

  const particles = useMemo(() =>
    Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: Math.random() * 10,
      duration: 10 + Math.random() * 10,
      size: 2 + Math.random() * 4,
      // SB LX colors: magenta, cyan, purple, gold
      color: ['#E91E8C', '#00D4FF', '#7C3AED', '#FACC15'][Math.floor(Math.random() * 4)]
    })), [particleCount]
  );

  // Safari: render static decorative dots
  if (shouldReduceEffects) {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full opacity-40"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
            }}
          />
        ))}
      </div>
    );
  }

  // Non-Safari: animated particles
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            bottom: '-10px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          animate={{
            y: [0, -window.innerHeight - 100],
            opacity: [0, 0.6, 0.6, 0],
            x: [0, Math.sin(p.id) * 50]
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  );
};

const GlassCard = ({ children, className = '', neon = false, onClick }) => {
  const { shouldReduceEffects } = useSafari();

  return (
    <motion.div
      className={`
        relative overflow-hidden rounded-2xl
        bg-gradient-to-br from-sb-magenta/10 to-sb-purple/5
        backdrop-blur-xl border border-sb-magenta/20
        ${neon ? 'neon-border' : ''}
        ${onClick ? 'cursor-pointer touch-feedback' : ''}
        ${className}
      `}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.02, borderColor: 'rgba(0, 245, 255, 0.3)' } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
    >
      {/* Safari: skip shimmer animation */}
      {!shouldReduceEffects && <div className="absolute inset-0 shimmer opacity-30" />}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

const NeonButton = ({ children, onClick, variant = 'primary', disabled = false, className = '' }) => {
  const { shouldReduceEffects } = useSafari();
  const variants = {
    primary: 'from-sb-magenta via-sb-fuchsia to-sb-magenta text-white font-bold shadow-lg shadow-sb-magenta/30',
    secondary: 'from-white/20 to-white/10 text-white border border-sb-magenta/30',
    danger: 'from-red-500 to-orange-500 text-white',
    seahawks: 'from-seahawks-green to-seahawks-navy text-white',
    patriots: 'from-patriots-red to-patriots-navy text-white'
  };

  // Safari: simpler hover without expensive boxShadow animation
  const hoverProps = shouldReduceEffects
    ? { scale: disabled ? 1 : 1.05 }
    : { scale: disabled ? 1 : 1.05, boxShadow: '0 0 30px rgba(233, 30, 140, 0.5)' };

  return (
    <motion.button
      className={`
        relative overflow-hidden px-6 py-3 rounded-xl font-semibold
        bg-gradient-to-r ${variants[variant]}
        disabled:opacity-50 disabled:cursor-not-allowed
        btn-neon transition-all duration-300
        ${className}
      `}
      onClick={onClick}
      disabled={disabled}
      whileHover={hoverProps}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
    >
      {children}
    </motion.button>
  );
};

const Modal = ({ isOpen, onClose, children, title }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div
          className="relative w-full max-w-md max-h-[80vh] overflow-y-auto
                     bg-gradient-to-br from-dark-700/95 to-dark-800/98
                     backdrop-blur-xl rounded-3xl
                     border border-white/20
                     shadow-2xl shadow-sb-magenta/10"
          style={{
            boxShadow: '0 0 40px rgba(233, 30, 140, 0.15), 0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/15 bg-dark-700/95 backdrop-blur-xl rounded-t-3xl">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const Logo = ({ size = 'large' }) => {
  const { shouldReduceEffects } = useSafari();
  const sizes = {
    small: 'text-2xl',
    medium: 'text-4xl',
    large: 'text-6xl'
  };

  const glowSizes = {
    small: 'blur-lg',
    medium: 'blur-xl',
    large: 'blur-2xl'
  };

  return (
    <motion.div
      className="flex flex-col items-center relative"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
    >
      {/* Glow effect behind logo - static in Safari */}
      {shouldReduceEffects ? (
        <div
          className={`absolute inset-0 ${glowSizes[size]} opacity-60`}
          style={{ background: 'radial-gradient(circle, rgba(233,30,140,0.4) 0%, transparent 70%)' }}
        />
      ) : (
        <motion.div
          className={`absolute inset-0 ${glowSizes[size]} opacity-60`}
          animate={{
            background: [
              'radial-gradient(circle, rgba(233,30,140,0.4) 0%, transparent 70%)',
              'radial-gradient(circle, rgba(0,212,255,0.4) 0%, transparent 70%)',
              'radial-gradient(circle, rgba(233,30,140,0.4) 0%, transparent 70%)'
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}
      {/* Text - static in Safari, animated otherwise */}
      {shouldReduceEffects ? (
        <div
          className={`font-display font-black ${sizes[size]} tracking-wider relative z-10
                     drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]`}
          style={{ textShadow: '0 0 20px #E91E8C' }}
        >
          <span className="text-sb-magenta drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">SB</span>
          <span className="text-sb-cyan mx-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">LX</span>
        </div>
      ) : (
        <motion.div
          className={`font-display font-black ${sizes[size]} tracking-wider relative z-10
                     drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]`}
          animate={{ textShadow: ['0 0 20px #E91E8C', '0 0 30px #00D4FF', '0 0 20px #E91E8C'] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-sb-magenta drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">SB</span>
          <span className="text-sb-cyan mx-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">LX</span>
        </motion.div>
      )}
      <motion.div
        className="text-xs tracking-[0.3em] text-white/70 mt-1 uppercase relative z-10
                  drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Quiniela 2026
      </motion.div>
    </motion.div>
  );
};

const TeamBadge = ({ team, selected, onClick, isCorrect, isWrong, disabled }) => {
  const isSeahawks = team === 'Seahawks';
  const gradient = isSeahawks
    ? 'from-seahawks-green/90 to-seahawks-navy'
    : 'from-patriots-red/90 to-patriots-navy';
  const glowColor = isSeahawks ? '#69BE28' : '#C60C30';
  const logoSrc = isSeahawks ? '/seahawks.png' : '/patriots.webp';

  // Determine border color based on state
  let borderClass = selected ? 'border-white shadow-xl scale-[1.02]' : 'border-white/20 opacity-80';
  let glowStyle = selected ? `0 0 35px ${glowColor}` : 'none';

  if (isCorrect) {
    borderClass = 'border-green-400 shadow-xl scale-[1.02]';
    glowStyle = '0 0 35px #22c55e';
  } else if (isWrong) {
    borderClass = 'border-red-500 shadow-xl scale-[1.02]';
    glowStyle = '0 0 35px #ef4444';
  }

  return (
    <motion.button
      className={`
        relative flex-1 py-5 px-4 rounded-2xl font-bold text-white text-center
        bg-gradient-to-br ${gradient}
        border-2 transition-all duration-300
        ${borderClass}
        ${disabled ? 'cursor-not-allowed pointer-events-none' : ''}
      `}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.03, opacity: 1 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      style={{ boxShadow: glowStyle }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 mx-auto rounded-xl bg-white/25 p-2 flex items-center justify-center
                      shadow-inner backdrop-blur-sm">
          <img src={logoSrc} alt={team} className="w-full h-full object-contain drop-shadow-md" />
        </div>
        <span className="text-base font-bold tracking-wide drop-shadow-md">{team}</span>
      </div>
      {/* Show correct checkmark */}
      {isCorrect && (
        <motion.div
          className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1.5 shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <Check className="w-4 h-4 text-white" />
        </motion.div>
      )}
      {/* Show wrong X */}
      {isWrong && (
        <motion.div
          className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1.5 shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <X className="w-4 h-4 text-white" />
        </motion.div>
      )}
      {/* Show selected checkmark (only when not showing correct/wrong) */}
      {selected && !isCorrect && !isWrong && (
        <motion.div
          className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <Check className="w-4 h-4 text-dark-900" />
        </motion.div>
      )}
    </motion.button>
  );
};

const OptionButton = ({ option, selected, onClick, index, isCorrect, isWrong, disabled }) => {
  // Determine styling based on state
  let buttonClass = selected
    ? 'bg-gradient-to-r from-sb-magenta to-sb-cyan text-white border-2 border-sb-magenta'
    : 'bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 hover:border-white/20';

  if (isCorrect) {
    buttonClass = 'bg-gradient-to-r from-green-500/30 to-green-600/30 text-white border-2 border-green-500';
  } else if (isWrong) {
    buttonClass = 'bg-gradient-to-r from-red-500/30 to-red-600/30 text-white border-2 border-red-500';
  }

  return (
    <motion.button
      className={`
        relative flex-1 py-4 px-4 rounded-xl font-semibold text-center
        transition-all duration-300 min-h-[60px]
        ${buttonClass}
        ${disabled ? 'cursor-not-allowed pointer-events-none' : ''}
      `}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index }}
    >
      <span className="text-sm sm:text-base leading-tight">{option}</span>
      {/* Show correct checkmark */}
      {isCorrect && (
        <motion.div
          className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1 shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <Check className="w-3 h-3 text-white" />
        </motion.div>
      )}
      {/* Show wrong X */}
      {isWrong && (
        <motion.div
          className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <X className="w-3 h-3 text-white" />
        </motion.div>
      )}
      {/* Show selected checkmark (only when not showing correct/wrong) */}
      {selected && !isCorrect && !isWrong && (
        <motion.div
          className="absolute -top-2 -right-2 bg-sb-magenta rounded-full p-1 shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <Check className="w-3 h-3 text-dark-900" />
        </motion.div>
      )}
    </motion.button>
  );
};

// ============================================
// LANDING SCREEN
// ============================================

const LandingScreen = ({ onEnter }) => {
  const { shouldReduceEffects } = useSafari();
  const [nickname, setNickname] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState('nickname'); // 'nickname' | 'pin' | 'disclaimer'
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckNickname = async () => {
    if (nickname.trim().length < 2) return;

    setLoading(true);
    setError('');

    try {
      const result = await checkNickname(nickname.trim());
      setIsNewUser(!result.exists);
      setStep('pin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 4) return;

    setLoading(true);
    setError('');

    try {
      let user;
      if (isNewUser) {
        // Show disclaimer for new users before registering
        setStep('disclaimer');
        setLoading(false);
        return;
      } else {
        // Login existing user
        user = await loginUser(nickname.trim(), pin);
        onEnter(user);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleAcceptDisclaimer = async () => {
    setLoading(true);
    setError('');

    try {
      const user = await registerUser(nickname.trim(), pin);
      onEnter(user);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('nickname');
    setPin('');
    setError('');
  };

  // Safari: use reduced blur class
  const blurClass = shouldReduceEffects ? 'blur-xl' : 'blur-[100px]';

  return (
    <div className={`min-h-screen ${shouldReduceEffects ? 'bg-dark-900' : 'bg-animated'} flex flex-col items-center justify-center p-6 relative overflow-hidden`}>
      <ParticleField />

      {/* Background glow effects - reduced blur in Safari */}
      <div className={`absolute top-1/4 -left-32 w-64 h-64 bg-seahawks-green/20 rounded-full ${blurClass}`} />
      <div className={`absolute bottom-1/4 -right-32 w-64 h-64 bg-patriots-red/20 rounded-full ${blurClass}`} />

      <motion.div
        className="relative z-10 w-full max-w-sm flex flex-col items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo - static in Safari, floating animation otherwise */}
        {shouldReduceEffects ? (
          <div className="mb-8">
            <Logo size="large" />
          </div>
        ) : (
          <motion.div
            className="mb-8"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Logo size="large" />
          </motion.div>
        )}

        {/* Event Info */}
        <GlassCard className="w-full p-6 mb-6">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-sb-magenta">
              <Trophy className="w-5 h-5" />
              <span className="font-display text-sm tracking-wider">SUPER BOWL 60</span>
            </div>

            <div className="flex items-center justify-center gap-6 py-4">
              <div className="text-center">
                {/* Patriots logo - static in Safari */}
                {shouldReduceEffects ? (
                  <div
                    className="w-20 h-20 mx-auto mb-2 rounded-full bg-white/10 p-1.5 flex items-center justify-center
                              border-2 border-patriots-red/50"
                    style={{ boxShadow: '0 0 15px rgba(198,12,48,0.4)' }}
                  >
                    <img src="/patriots.webp" alt="Patriots" className="w-full h-full object-contain drop-shadow-lg" />
                  </div>
                ) : (
                  <motion.div
                    className="w-20 h-20 mx-auto mb-2 rounded-full bg-white/10 p-1.5 flex items-center justify-center
                              border-2 border-patriots-red/50"
                    whileHover={{ scale: 1.1 }}
                    animate={{ boxShadow: ['0 0 15px rgba(198,12,48,0.3)', '0 0 25px rgba(198,12,48,0.5)', '0 0 15px rgba(198,12,48,0.3)'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <img src="/patriots.webp" alt="Patriots" className="w-full h-full object-contain drop-shadow-lg" />
                  </motion.div>
                )}
                <div className="text-xs text-white/50 mb-1">Away</div>
                <div className="font-bold text-white border-b-2 border-patriots-red inline-block px-1">Patriots</div>
              </div>
              <div className="text-3xl font-display text-white/40">VS</div>
              <div className="text-center">
                {/* Seahawks logo - static in Safari */}
                {shouldReduceEffects ? (
                  <div
                    className="w-20 h-20 mx-auto mb-2 rounded-full bg-white/10 p-1.5 flex items-center justify-center
                              border-2 border-seahawks-green/50"
                    style={{ boxShadow: '0 0 15px rgba(105,190,40,0.4)' }}
                  >
                    <img src="/seahawks.png" alt="Seahawks" className="w-full h-full object-contain drop-shadow-lg" />
                  </div>
                ) : (
                  <motion.div
                    className="w-20 h-20 mx-auto mb-2 rounded-full bg-white/10 p-1.5 flex items-center justify-center
                              border-2 border-seahawks-green/50"
                    whileHover={{ scale: 1.1 }}
                    animate={{ boxShadow: ['0 0 15px rgba(105,190,40,0.3)', '0 0 25px rgba(105,190,40,0.5)', '0 0 15px rgba(105,190,40,0.3)'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <img src="/seahawks.png" alt="Seahawks" className="w-full h-full object-contain drop-shadow-lg" />
                  </motion.div>
                )}
                <div className="text-xs text-white/50 mb-1">Home</div>
                <div className="font-bold text-white border-b-2 border-seahawks-green inline-block px-1">Seahawks</div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 space-y-1 text-sm text-white/60">
              <p><Clock className="w-3 h-3 inline mr-1" /> {eventInfo.date}</p>
              <p><Flag className="w-3 h-3 inline mr-1" /> {eventInfo.venue}, {eventInfo.location}</p>
              <p><Music className="w-3 h-3 inline mr-1" /> Halftime: {eventInfo.halftime}</p>
            </div>
          </div>
        </GlassCard>

        {/* Registration Form */}
        <GlassCard className="w-full p-6" neon>
          <AnimatePresence mode="wait">
            {step === 'nickname' && (
              <motion.div
                key="nickname"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="text-center">
                  <h2 className="text-xl font-bold text-white mb-1">Entra a la Quiniela</h2>
                  <p className="text-sm text-white/50">Ingresa tu nickname para participar</p>
                </div>

                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Tu nickname..."
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                           text-white placeholder-white/30 focus:outline-none focus:border-sb-magenta
                           focus:ring-2 focus:ring-sb-magenta/20 transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleCheckNickname()}
                />

                {error && (
                  <p className="text-red-400 text-sm text-center">{error}</p>
                )}

                <NeonButton
                  onClick={handleCheckNickname}
                  disabled={nickname.trim().length < 2 || loading}
                  className="w-full py-4 text-lg"
                >
                  <span className="flex items-center justify-center gap-3 font-bold tracking-wide">
                    {loading ? 'Verificando...' : 'CONTINUAR'}
                    <ChevronRight className="w-6 h-6" />
                  </span>
                </NeonButton>
              </motion.div>
            )}

            {step === 'pin' && (
              <motion.div
                key="pin"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 text-white/50 hover:text-white text-sm transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Cambiar nickname
                </button>

                <div className="text-center">
                  <h2 className="text-xl font-bold text-white mb-1">
                    {isNewUser ? '¡Bienvenido!' : '¡Hola de nuevo!'}
                  </h2>
                  <p className="text-sm text-white/50">
                    {isNewUser
                      ? `Crea un PIN de 4 dígitos para "${nickname}"`
                      : `Ingresa tu PIN para entrar como "${nickname}"`
                    }
                  </p>
                </div>

                <input
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  maxLength={4}
                  className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10
                           text-white text-center text-2xl tracking-[0.5em] placeholder-white/30
                           focus:outline-none focus:border-sb-magenta
                           focus:ring-2 focus:ring-sb-magenta/20 transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
                  autoFocus
                />

                {error && (
                  <p className="text-red-400 text-sm text-center">{error}</p>
                )}

                <NeonButton
                  onClick={handlePinSubmit}
                  disabled={pin.length !== 4 || loading}
                  className="w-full py-4 text-lg"
                >
                  <span className="flex items-center justify-center gap-3 font-bold tracking-wide">
                    {loading ? 'Entrando...' : isNewUser ? 'CREAR CUENTA' : 'ENTRAR'}
                    <ChevronRight className="w-6 h-6" />
                  </span>
                </NeonButton>

                {isNewUser && (
                  <p className="text-xs text-white/40 text-center">
                    Recuerda tu PIN, lo necesitarás para volver a entrar
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>

      {/* Disclaimer Modal */}
      <Modal
        isOpen={step === 'disclaimer'}
        onClose={() => setStep('pin')}
        title="¿Le entras a la quiniela?"
      >
        <div className="text-center space-y-6">
          {/* Money icon with glow */}
          <motion.div
            className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600
                      flex items-center justify-center relative"
            animate={{
              scale: [1, 1.1, 1],
              boxShadow: [
                '0 0 20px rgba(74, 222, 128, 0.4)',
                '0 0 40px rgba(74, 222, 128, 0.6)',
                '0 0 20px rgba(74, 222, 128, 0.4)'
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <DollarSign className="w-12 h-12 text-white drop-shadow-lg" />
            {/* Sparkle effects */}
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ rotate: [0, 360], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </motion.div>
          </motion.div>

          <div className="space-y-3">
            <motion.h4
              className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              $500 MXN
            </motion.h4>
            <p className="text-white/90">
              La entrada a la <span className="font-bold text-sb-magenta">quiniela</span> es de 500 pesos. Tienes hasta 5 min antes de que inicie el partido para meter tus resultados.
            </p>
            <p className="text-white/60 text-sm">
              Pásaselos al admin o transfiere a:
            </p>
            <div className="mt-2 p-3 rounded-xl bg-white/5 border border-white/10 text-left relative">
              <p className="text-xs text-white/50 mb-1">CLABE</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-white font-mono text-sm font-bold tracking-wide">638180000167452773</p>
                <button
                  onClick={(e) => {
                    navigator.clipboard.writeText('638180000167452773');
                    const btn = e.currentTarget;
                    btn.classList.add('bg-green-500/30');
                    setTimeout(() => btn.classList.remove('bg-green-500/30'), 1500);
                  }}
                  className="p-2 rounded-lg bg-white/10 text-white
                           hover:bg-white/20 transition-all"
                  title="Copiar CLABE"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-white/50 mt-2">Nu México - Gerardo Ayala</p>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep('pin')}
              className="flex-1 py-3 px-4 rounded-xl font-semibold text-white/70
                       bg-white/10 border border-white/20 hover:bg-white/15
                       transition-all duration-200"
            >
              Me rajé
            </button>
            <motion.button
              onClick={handleAcceptDisclaimer}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl font-black text-white text-lg
                       bg-gradient-to-r from-sb-magenta via-sb-fuchsia to-sb-magenta
                       shadow-lg shadow-sb-magenta/40 border-2 border-white/20
                       disabled:opacity-50"
              whileHover={{ scale: loading ? 1 : 1.03, boxShadow: '0 0 30px rgba(233, 30, 140, 0.5)' }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? 'Registrando...' : 'Me enclocho'}
            </motion.button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ============================================
// DASHBOARD SCREEN
// ============================================

const DashboardScreen = ({ nickname, participants, onStartPredictions, onLeaderboard, onViewTicket, answeredCount, onLogout }) => {
  const { shouldReduceEffects } = useSafari();
  const [showRules, setShowRules] = useState(false);
  const potAmount = (participants + 1) * eventInfo.entryFee;
  const animatedPot = useAnimatedNumber(potAmount, 2500);

  const formatMoney = (num) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  // Safari: use reduced blur class
  const blurClass = shouldReduceEffects ? 'blur-xl' : 'blur-[100px]';

  return (
    <div className={`min-h-screen ${shouldReduceEffects ? 'bg-dark-900' : 'bg-animated'} relative overflow-hidden`}>
      <ParticleField />

      {/* Background glows - reduced blur in Safari */}
      <div className={`absolute top-1/4 -left-32 w-64 h-64 bg-sb-magenta/20 rounded-full ${blurClass}`} />
      <div className={`absolute bottom-1/4 -right-32 w-64 h-64 bg-sb-cyan/20 rounded-full ${blurClass}`} />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 glass-dark border-b border-white/5">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <Logo size="small" />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRules(true)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                title="Reglas"
              >
                <Info className="w-5 h-5 text-white/70" />
              </button>
              <button
                onClick={onLogout}
                className="p-2 rounded-full bg-white/5 hover:bg-red-500/20 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5 text-white/70 hover:text-red-400" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-white/50 text-sm">Bienvenido</p>
            <h1 className="text-2xl font-bold text-white">{nickname}</h1>
          </motion.div>

          {/* The Pot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="p-6" neon>
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-white/50">
                  <Gift className="w-4 h-4" />
                  <span className="text-sm uppercase tracking-wider">El Bote</span>
                </div>
                {/* Safari: skip pot-animate class */}
                <div
                  className={`text-4xl sm:text-5xl font-display font-black text-sb-magenta ${shouldReduceEffects ? '' : 'pot-animate'}`}
                  style={{ textShadow: '0 0 30px rgba(233, 30, 140, 0.6)' }}
                >
                  {formatMoney(animatedPot)}
                </div>
                <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
                  <Users className="w-4 h-4" />
                  <span>{participants + 1} participantes</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Prize - Winner takes all */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="p-4">
              <div className="flex items-center justify-center text-center">
                <div className="space-y-1">
                  <Crown className="w-8 h-8 mx-auto text-yellow-400" />
                  <div className="text-sm text-white/50">Winner takes it all</div>
                  <div className="font-bold text-xl text-white">{formatMoney(potAmount)}</div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* CTA Button - Main Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-2"
          >
            {shouldReduceEffects ? (
              /* Safari: static button without infinite animations */
              <button
                onClick={onStartPredictions}
                className="w-full py-5 px-6 rounded-2xl font-black text-white text-xl
                         bg-gradient-to-r from-sb-magenta via-sb-fuchsia to-sb-magenta
                         shadow-xl shadow-sb-magenta/30 border-2 border-white/20
                         relative overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                <span className="relative flex flex-col items-center justify-center gap-1">
                  <span className="flex items-center gap-3 tracking-wide">
                    <Zap className="w-7 h-7" />
                    {answeredCount === questions.length ? 'VER MIS PREDICCIONES' : 'HACER MIS PREDICCIONES'}
                    <ChevronRight className="w-7 h-7" />
                  </span>
                  <span className="text-sm font-normal opacity-80">
                    {answeredCount}/{questions.length} contestadas
                  </span>
                </span>
              </button>
            ) : (
              <motion.button
                onClick={onStartPredictions}
                className="w-full py-5 px-6 rounded-2xl font-black text-white text-xl
                         bg-gradient-to-r from-sb-magenta via-sb-fuchsia to-sb-magenta
                         shadow-xl shadow-sb-magenta/30 border-2 border-white/20
                         relative overflow-hidden"
                whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(233, 30, 140, 0.5)' }}
                whileTap={{ scale: 0.98 }}
                animate={{
                  boxShadow: [
                    '0 10px 40px rgba(233, 30, 140, 0.3)',
                    '0 10px 50px rgba(233, 30, 140, 0.5)',
                    '0 10px 40px rgba(233, 30, 140, 0.3)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
                <span className="relative flex flex-col items-center justify-center gap-1">
                  <span className="flex items-center gap-3 tracking-wide">
                    <Zap className="w-7 h-7" />
                    {answeredCount === questions.length ? 'VER MIS PREDICCIONES' : 'HACER MIS PREDICCIONES'}
                    <ChevronRight className="w-7 h-7" />
                  </span>
                  <span className="text-sm font-normal opacity-80">
                    {answeredCount}/{questions.length} contestadas
                  </span>
                </span>
              </motion.button>
            )}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="space-y-3"
          >
            {/* View Ticket Button - only when all questions answered */}
            {answeredCount === questions.length && (
              <button
                onClick={onViewTicket}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sb-magenta/20 to-sb-fuchsia/20
                         border border-sb-magenta/30 hover:border-sb-magenta/50
                         flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
              >
                <Ticket className="w-5 h-5 text-sb-magenta" />
                <span className="text-white font-medium">Ver Mi Ticket</span>
                <ChevronRight className="w-5 h-5 text-white/50" />
              </button>
            )}

            {/* Leaderboard Button */}
            <button
              onClick={onLeaderboard}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sb-cyan/20 to-sb-purple/20
                       border border-sb-cyan/30 hover:border-sb-cyan/50
                       flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
            >
              <Trophy className="w-5 h-5 text-sb-cyan" />
              <span className="text-white font-medium">Ver Leaderboard</span>
              <ChevronRight className="w-5 h-5 text-white/50" />
            </button>
          </motion.div>

          {/* Payment Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <GlassCard className="p-4">
              <div className="text-center mb-3">
                <p className="text-white/60 text-sm">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Pásale al admin o transfiere a:
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-white/50 mb-1">CLABE</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white font-mono text-sm font-bold tracking-wide">638180000167452773</p>
                  <button
                    onClick={(e) => {
                      navigator.clipboard.writeText('638180000167452773');
                      const btn = e.currentTarget;
                      btn.classList.add('bg-green-500/30');
                      setTimeout(() => btn.classList.remove('bg-green-500/30'), 1500);
                    }}
                    className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
                    title="Copiar CLABE"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-white/50 mt-2">Nu México - Gerardo Ayala</p>
              </div>
            </GlassCard>
          </motion.div>

          {/* Event info small */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-white/40 text-sm mt-4"
          >
            Super Bowl LX • 8 de Febrero, 2026
          </motion.p>
        </main>
      </div>

      {/* Rules Modal */}
      <Modal isOpen={showRules} onClose={() => setShowRules(false)} title="Reglas">
        <ul className="space-y-3">
          {rules.map((rule, i) => (
            <motion.li
              key={i}
              className="flex items-start gap-3 text-white/80"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sb-magenta/20 text-sb-magenta
                            text-xs flex items-center justify-center font-bold">
                {i + 1}
              </span>
              <span className="text-sm">{rule}</span>
            </motion.li>
          ))}
        </ul>
      </Modal>
    </div>
  );
};

// ============================================
// PREDICTIONS SCREEN
// ============================================

const PredictionsScreen = ({ userId, nickname, predictions, setPredictions, onComplete, onBack, predictionsLocked, answersVisible, correctAnswers }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragDirection, setDragDirection] = useState(0); // Track swipe direction for animation
  const currentQuestion = questions[currentIndex];
  const progress = (Object.keys(predictions).length / questions.length) * 100;

  // Swipe navigation handler
  const handleDragEnd = (event, info) => {
    const swipeThreshold = 50; // Minimum distance for swipe
    const velocityThreshold = 200; // Minimum velocity for quick swipe

    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // Swipe left (next question)
    if (offset < -swipeThreshold || velocity < -velocityThreshold) {
      if (currentIndex < questions.length - 1) {
        setDragDirection(-1);
        setCurrentIndex(prev => prev + 1);
        setShowHint(false);
      }
    }
    // Swipe right (previous question)
    else if (offset > swipeThreshold || velocity > velocityThreshold) {
      if (currentIndex > 0) {
        setDragDirection(1);
        setCurrentIndex(prev => prev - 1);
        setShowHint(false);
      }
    }
  };

  const handleSelect = async (option) => {
    // Don't allow changes if predictions are locked
    if (predictionsLocked) return;

    // Update local state immediately
    const newPredictions = {
      ...predictions,
      [currentQuestion.id]: option
    };
    setPredictions(newPredictions);

    // Save to backend immediately
    if (userId) {
      setSaving(true);
      try {
        await savePredictions(userId, { [currentQuestion.id]: option });
      } catch (error) {
        console.error('Error saving prediction:', error);
      } finally {
        setSaving(false);
      }
    }

    // Auto-advance after selection
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setDragDirection(-1);
        setCurrentIndex(prev => prev + 1);
        setShowHint(false);
      }
    }, 300);
  };

  // Get correct answer for current question
  const currentCorrectAnswer = correctAnswers[currentQuestion.id] || correctAnswers[String(currentQuestion.id)];
  const userAnswer = predictions[currentQuestion.id] || predictions[String(currentQuestion.id)];

  const canFinish = Object.keys(predictions).length === questions.length;

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

  return (
    <div className="min-h-screen bg-dark-900 relative overflow-hidden">
      <ParticleField />

      {/* Background based on category */}
      <div className={`absolute inset-0 transition-colors duration-500 ${
        currentQuestion.category === 'halftime' ? 'bg-purple-900/10' :
        currentQuestion.highlight ? 'bg-sb-magenta/5' : ''
      }`} />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 glass-dark border-b border-white/5">
          <div className="max-w-lg mx-auto px-4 py-3">
            {/* Back button and title row */}
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={onBack}
                className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Inicio</span>
              </button>
              <div className="text-center">
                <span className="text-sm text-white/50">Pregunta</span>
                <span className="text-lg font-bold text-white ml-2">
                  {currentIndex + 1}/{questions.length}
                </span>
              </div>
              <div className="w-16" /> {/* Spacer for balance */}
            </div>

            {/* Question navigation */}
            <div className="flex items-center justify-center gap-4 mb-2">
              <button
                onClick={() => { if (currentIndex > 0) { setDragDirection(1); setCurrentIndex(prev => prev - 1); setShowHint(false); }}}
                disabled={currentIndex === 0}
                className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <span className="text-white/50 text-sm">Anterior / Siguiente</span>
              <button
                onClick={() => { if (currentIndex < questions.length - 1) { setDragDirection(-1); setCurrentIndex(prev => prev + 1); setShowHint(false); }}}
                disabled={currentIndex === questions.length - 1}
                className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-sb-magenta to-sb-cyan"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </header>

        {/* Locked banner */}
        {predictionsLocked && (
          <div className="bg-yellow-500/20 border-b border-yellow-500/30 px-4 py-2">
            <p className="text-center text-yellow-300 text-sm">
              🔒 Las predicciones están bloqueadas {answersVisible && '- Revisa tus resultados'}
            </p>
          </div>
        )}

        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 flex flex-col">
          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: dragDirection >= 0 ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dragDirection >= 0 ? -50 : 50 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col touch-pan-y"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              dragDirectionLock
            >
              <GlassCard
                className={`flex-1 p-6 flex flex-col ${currentQuestion.highlight ? 'neon-border-green' : ''}`}
              >
                {/* Category badge */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className={`
                    inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                    ${currentQuestion.category === 'pregame' ? 'bg-blue-500/20 text-blue-400' :
                      currentQuestion.category === 'game' ? 'bg-orange-500/20 text-orange-400' :
                      currentQuestion.category === 'halftime' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-sb-magenta/20 text-sb-magenta'}
                  `}>
                    {getCategoryIcon(currentQuestion.category)}
                    {getCategoryLabel(currentQuestion.category)}
                  </span>
                  {currentQuestion.highlight && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                      <Sparkles className="w-3 h-3" /> Importante
                    </span>
                  )}
                </div>

                {/* Question */}
                <div className="flex-1 flex flex-col items-center justify-center">
                  <h2 className={`text-xl sm:text-2xl font-bold text-white text-center leading-tight ${
                    currentQuestion.highlight ? 'text-2xl sm:text-3xl' : ''
                  }`}>
                    {currentQuestion.question}
                  </h2>

                  {/* Hint Button & Explanation */}
                  {currentQuestion.explanation && (
                    <div className="mt-4 w-full max-w-sm">
                      <button
                        onClick={() => setShowHint(!showHint)}
                        className="flex items-center justify-center gap-2 mx-auto px-4 py-2 rounded-full
                                 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                      >
                        <Info className="w-4 h-4 text-sb-cyan" />
                        <span className="text-sm text-white/60">{showHint ? 'Ocultar pista' : '¿Qué significa?'}</span>
                      </button>
                      <AnimatePresence>
                        {showHint && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 text-sm text-white/60 text-center leading-relaxed overflow-hidden"
                          >
                            {currentQuestion.explanation}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Options */}
                <div className="space-y-3 mt-6">
                  {currentQuestion.options[0] === 'Seahawks' || currentQuestion.options[0] === 'Patriots' ? (
                    <div className="flex gap-3">
                      {currentQuestion.options.map((option, idx) => {
                        const isSelected = predictions[currentQuestion.id] === option;
                        const isThisCorrect = answersVisible && currentCorrectAnswer === option;
                        const isThisWrong = answersVisible && isSelected && currentCorrectAnswer && currentCorrectAnswer !== option;

                        return (
                          <TeamBadge
                            key={option}
                            team={option}
                            selected={isSelected}
                            onClick={() => handleSelect(option)}
                            isCorrect={isThisCorrect}
                            isWrong={isThisWrong}
                            disabled={predictionsLocked}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className={`${currentQuestion.options.length > 2 ? 'grid grid-cols-2 gap-3' : 'flex gap-3'}`}>
                      {currentQuestion.options.map((option, idx) => {
                        const isSelected = predictions[currentQuestion.id] === option;
                        const isThisCorrect = answersVisible && currentCorrectAnswer === option;
                        const isThisWrong = answersVisible && isSelected && currentCorrectAnswer && currentCorrectAnswer !== option;

                        return (
                          <OptionButton
                            key={option}
                            option={option}
                            index={idx}
                            selected={isSelected}
                            onClick={() => handleSelect(option)}
                            isCorrect={isThisCorrect}
                            isWrong={isThisWrong}
                            disabled={predictionsLocked}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          </AnimatePresence>

          {/* Swipe indicator */}
          <div className="flex items-center justify-center gap-2 mt-3 text-white/30 text-xs">
            {currentIndex > 0 && <ChevronLeft className="w-4 h-4" />}
            <span>Desliza para navegar</span>
            {currentIndex < questions.length - 1 && <ChevronRight className="w-4 h-4" />}
          </div>

          {/* Question dots navigation */}
          <div className="flex justify-center gap-1.5 mt-3 flex-wrap max-w-xs mx-auto">
            {questions.map((q, i) => {
              const qAnswer = predictions[q.id] || predictions[String(q.id)];
              const qCorrect = correctAnswers[q.id] || correctAnswers[String(q.id)];
              const isAnswered = !!qAnswer;
              const isCorrectAnswer = answersVisible && qCorrect && qAnswer === qCorrect;
              const isWrongAnswer = answersVisible && qCorrect && qAnswer && qAnswer !== qCorrect;

              let dotColor = 'bg-white/20';
              if (i === currentIndex) {
                dotColor = 'bg-sb-magenta w-6';
              } else if (isCorrectAnswer) {
                dotColor = 'bg-green-500';
              } else if (isWrongAnswer) {
                dotColor = 'bg-red-500';
              } else if (isAnswered) {
                dotColor = 'bg-sb-cyan';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => { setDragDirection(i > currentIndex ? -1 : 1); setCurrentIndex(i); setShowHint(false); }}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${dotColor}`}
                />
              );
            })}
          </div>

          {/* Finish button */}
          {canFinish && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <NeonButton onClick={onComplete} className="w-full py-4 text-lg">
                <span className="flex items-center justify-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  Ver Mi Ticket
                  <ChevronRight className="w-6 h-6" />
                </span>
              </NeonButton>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};

// ============================================
// TICKET SCREEN - FULL PREDICTIONS VIEW
// ============================================

const TicketScreen = ({ nickname, predictions, onRestart, onLeaderboard, onEditPredictions, answersVisible, correctAnswers, predictionsLocked }) => {
  // localStorage keys are strings, so check both number and string keys
  const winner = predictions[14] || predictions['14'];
  const mvp = predictions[16] || predictions['16'];
  const totalPointsPrediction = predictions[15] || predictions['15'];

  // Calculate points earned
  const getPointsForQuestion = (questionId) => {
    // Question 14 (winner) is worth 20 points, others are 10 points
    return questionId === 14 ? 20 : 10;
  };

  const calculateScore = () => {
    if (!answersVisible || !correctAnswers) return { earned: 0, possible: 0, correct: 0, total: 0 };

    let earned = 0;
    let possible = 0;
    let correctCount = 0;

    questions.forEach(q => {
      const userAnswer = predictions[q.id] || predictions[String(q.id)];
      const correctAnswer = correctAnswers[q.id] || correctAnswers[String(q.id)];
      const points = getPointsForQuestion(q.id);

      if (correctAnswer) {
        possible += points;
        if (userAnswer === correctAnswer) {
          earned += points;
          correctCount++;
        }
      }
    });

    return { earned, possible, correct: correctCount, total: Object.keys(correctAnswers).length };
  };

  const score = calculateScore();

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

  return (
    <div className="min-h-screen bg-dark-900 relative overflow-hidden">
      <ParticleField />

      <div className="absolute inset-0 bg-gradient-to-b from-sb-magenta/10 via-transparent to-sb-purple/10" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 glass-dark border-b border-white/5">
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={onLeaderboard}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <Logo size="small" />
              {!predictionsLocked ? (
                <button
                  onClick={onEditPredictions}
                  className="px-3 py-1.5 rounded-lg bg-sb-magenta/20 hover:bg-sb-magenta/30
                           text-sb-magenta text-sm font-medium transition-colors"
                >
                  Editar
                </button>
              ) : (
                <div className="w-16" />
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-1">Mi Ticket</h2>
            <p className="text-white/50 text-sm">{nickname}</p>
          </motion.div>

          {/* Score Card - Only when answers visible */}
          {answersVisible && score.total > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <GlassCard className="p-4" neon>
                <div className="text-center">
                  <div className="text-white/50 text-sm mb-1">Mi Puntaje</div>
                  <div className="text-4xl font-bold text-sb-magenta mb-2">
                    {score.earned} <span className="text-white/40 text-xl">/ {score.possible}</span>
                  </div>
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <span className="text-green-400">✓ {score.correct} correctas</span>
                    <span className="text-red-400">✗ {score.total - score.correct} incorrectas</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-3 gap-3"
          >
            <GlassCard className="p-3 text-center">
              <div className={`w-10 h-10 mx-auto mb-1.5 rounded-lg p-1.5 flex items-center justify-center
                            border ${winner === 'Seattle Seahawks' ? 'border-seahawks-green/50 bg-seahawks-green/10' : 'border-patriots-red/50 bg-patriots-red/10'}`}>
                <img
                  src={winner === 'Seattle Seahawks' ? '/seahawks.png' : '/patriots.webp'}
                  alt={winner}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-[10px] text-white/50 mb-0.5">Ganador</div>
              <div className="font-bold text-white text-xs">{winner?.replace('Seattle ', '').replace('New England ', '')}</div>
            </GlassCard>
            <GlassCard className="p-3 text-center">
              <div className="w-10 h-10 mx-auto mb-1.5 rounded-lg bg-sb-magenta/20 border border-sb-magenta/50
                            flex items-center justify-center">
                <Star className="w-5 h-5 text-sb-magenta" />
              </div>
              <div className="text-[10px] text-white/50 mb-0.5">MVP</div>
              <div className="font-bold text-white text-xs truncate">{mvp}</div>
            </GlassCard>
            <GlassCard className="p-3 text-center">
              <div className="w-10 h-10 mx-auto mb-1.5 rounded-lg bg-sb-cyan/20 border border-sb-cyan/50
                            flex items-center justify-center">
                <Target className="w-5 h-5 text-sb-cyan" />
              </div>
              <div className="text-[10px] text-white/50 mb-0.5">Puntos</div>
              <div className="font-bold text-white text-xs truncate">{totalPointsPrediction}</div>
            </GlassCard>
          </motion.div>

          {/* Leaderboard Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <button
              onClick={onLeaderboard}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sb-cyan/20 to-sb-purple/20
                       border border-sb-cyan/30 hover:border-sb-cyan/50
                       flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
            >
              <Trophy className="w-5 h-5 text-sb-cyan" />
              <span className="text-white font-medium">Ver Leaderboard</span>
              <ChevronRight className="w-5 h-5 text-white/50" />
            </button>
          </motion.div>

          {/* All Predictions by Category */}
          {categoryOrder.map((category, catIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + catIndex * 0.1 }}
            >
              <div className={`flex items-center gap-2 mb-3 px-1`}>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getCategoryColor(category)}`}>
                  {getCategoryIcon(category)}
                  {getCategoryLabel(category)}
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <GlassCard className="divide-y divide-white/5">
                {groupedQuestions[category]?.map((q, idx) => {
                  const userAnswer = predictions[q.id] || predictions[String(q.id)];
                  const correctAnswer = correctAnswers?.[q.id] || correctAnswers?.[String(q.id)];
                  const hasCorrectAnswer = answersVisible && correctAnswer;
                  const isCorrect = hasCorrectAnswer && userAnswer === correctAnswer;
                  const isWrong = hasCorrectAnswer && userAnswer && userAnswer !== correctAnswer;
                  const points = getPointsForQuestion(q.id);

                  return (
                    <div
                      key={q.id}
                      className={`px-4 py-3 ${q.highlight ? 'bg-sb-magenta/5' : ''} ${isCorrect ? 'bg-green-500/5' : ''} ${isWrong ? 'bg-red-500/5' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-white/70 text-sm leading-snug">
                            {q.highlight && <Sparkles className="w-3 h-3 inline mr-1 text-yellow-400" />}
                            {q.question}
                            {q.highlight && <span className="text-yellow-400 text-xs ml-1">(20 pts)</span>}
                          </p>
                          {/* Show correct answer if wrong */}
                          {isWrong && (
                            <p className="text-green-400 text-xs mt-1">
                              ✓ Correcta: {correctAnswer}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {/* User's answer */}
                          <div className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold
                                        ${!userAnswer
                                          ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                          : isCorrect
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                            : isWrong
                                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                              : 'bg-sb-cyan/20 text-sb-cyan border border-sb-cyan/30'}`}>
                            {userAnswer || 'Sin respuesta'}
                          </div>
                          {/* Points indicator */}
                          {hasCorrectAnswer && (
                            <div className={`text-xs font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                              {isCorrect ? `+${points} pt${points > 1 ? 's' : ''}` : '0 pts'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </GlassCard>
            </motion.div>
          ))}

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3 pb-6"
          >
            <NeonButton onClick={onLeaderboard} className="w-full py-4">
              <span className="flex items-center justify-center gap-3">
                <Trophy className="w-5 h-5" />
                Ver Leaderboard
              </span>
            </NeonButton>

            <NeonButton variant="secondary" onClick={onRestart} className="w-full">
              <span className="flex items-center justify-center gap-2">
                <ChevronLeft className="w-5 h-5" />
                Volver al Inicio
              </span>
            </NeonButton>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

// ============================================
// MAIN APP
// ============================================

export default function App() {
  const [screen, setScreen] = useState('landing');
  const [user, setUser] = useLocalStorage('quiniela_user', null);
  const [predictions, setPredictions] = useLocalStorage('quiniela_predictions', {});
  const [participants, setParticipants] = useState(0);
  const [predictionsLocked, setPredictionsLocked] = useState(false);
  const [answersVisible, setAnswersVisible] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState({});

  // Fetch settings and participant count on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getSettings();
        setPredictionsLocked(settings.predictionsLocked);
        setAnswersVisible(settings.answersVisible || false);

        // If answers are visible, fetch correct answers
        if (settings.answersVisible) {
          try {
            const answers = await getPublicCorrectAnswers();
            setCorrectAnswers(answers || {});
          } catch (err) {
            console.error('Error fetching correct answers:', err);
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleEnter = async (userData) => {
    // userData comes from login/register with id, nickname, created_at
    const newUser = {
      id: userData.id,
      nickname: userData.nickname,
      joinedAt: userData.created_at || Date.now()
    };
    setUser(newUser);

    // Load predictions from backend
    try {
      const backendPredictions = await getUserPredictions(userData.id);
      // Filter out null values for display, but keep the structure
      const validPredictions = {};
      Object.entries(backendPredictions).forEach(([key, value]) => {
        if (value !== null) {
          validPredictions[key] = value;
        }
      });
      setPredictions(validPredictions);
    } catch (error) {
      console.error('Error loading predictions:', error);
    }

    setScreen('dashboard');
  };

  const handleStartPredictions = () => {
    setScreen('predictions');
  };

  const handleCompletePredictions = async () => {
    try {
      // Save predictions to backend
      if (user?.id) {
        await savePredictions(user.id, predictions);
      }
    } catch (error) {
      console.error('Error saving predictions:', error);
    }
    setScreen('ticket');
  };

  const handleViewTicket = () => {
    setScreen('ticket');
  };

  const handleLeaderboard = () => {
    setScreen('leaderboard');
  };

  const handleEditPredictions = () => {
    setScreen('predictions');
  };

  const handleRestart = () => {
    setScreen('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setPredictions({});
    setScreen('landing');
  };

  const handleAdmin = () => {
    setScreen('admin');
  };

  // Check for existing user on mount and load predictions from backend
  useEffect(() => {
    const loadUserData = async () => {
      if (user?.id) {
        try {
          // Load predictions from backend
          const backendPredictions = await getUserPredictions(user.id);
          // Filter out null values for display
          const validPredictions = {};
          Object.entries(backendPredictions).forEach(([key, value]) => {
            if (value !== null) {
              validPredictions[key] = value;
            }
          });
          setPredictions(validPredictions);

          // Always navigate to dashboard on reload
          setScreen('dashboard');
        } catch (error) {
          console.error('Error loading predictions:', error);
          setScreen('dashboard');
        }
      }
    };

    if (user) {
      loadUserData();
    }
  }, []);

  return (
    <>
      {/* Admin button - only visible on dashboard */}
      {screen === 'dashboard' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={handleAdmin}
          className="fixed bottom-4 right-4 z-50 p-3 rounded-full bg-white/5 border border-white/10
                   hover:bg-white/10 transition-all"
          title="Panel de Admin"
        >
          <Shield className="w-5 h-5 text-white/30 hover:text-white/60" />
        </motion.button>
      )}

      <AnimatePresence mode="wait">
        {screen === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LandingScreen onEnter={handleEnter} />
          </motion.div>
        )}

        {screen === 'dashboard' && user && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <DashboardScreen
              nickname={user.nickname}
              participants={participants}
              onStartPredictions={handleStartPredictions}
              onLeaderboard={handleLeaderboard}
              onViewTicket={handleViewTicket}
              predictionsLocked={predictionsLocked}
              answeredCount={Object.keys(predictions).length}
              onLogout={handleLogout}
            />
          </motion.div>
        )}

        {screen === 'predictions' && user && (
          <motion.div
            key="predictions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PredictionsScreen
              userId={user.id}
              nickname={user.nickname}
              predictions={predictions}
              setPredictions={setPredictions}
              onComplete={handleCompletePredictions}
              onBack={handleRestart}
              predictionsLocked={predictionsLocked}
              answersVisible={answersVisible}
              correctAnswers={correctAnswers}
            />
          </motion.div>
        )}

        {screen === 'leaderboard' && user && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LeaderboardScreen
              user={user}
              onViewTicket={handleViewTicket}
              onBack={handleRestart}
            />
          </motion.div>
        )}

        {screen === 'ticket' && user && (
          <motion.div
            key="ticket"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <TicketScreen
              nickname={user.nickname}
              predictions={predictions}
              onRestart={handleRestart}
              onLeaderboard={handleLeaderboard}
              onEditPredictions={handleEditPredictions}
              answersVisible={answersVisible}
              correctAnswers={correctAnswers}
              predictionsLocked={predictionsLocked}
            />
          </motion.div>
        )}

        {screen === 'admin' && (
          <motion.div
            key="admin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AdminScreen onBack={() => setScreen(user ? 'leaderboard' : 'landing')} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
