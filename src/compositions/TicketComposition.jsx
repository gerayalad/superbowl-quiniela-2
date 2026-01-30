import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from 'remotion';

// SB LX Official Colors
const COLORS = {
  magenta: '#E91E8C',
  fuchsia: '#D946EF',
  cyan: '#00D4FF',
  purple: '#7C3AED',
  gold: '#FACC15',
  dark: '#0D0015',
};

// Background with animated gradient - SB LX style
const AnimatedBackground = () => {
  const frame = useCurrentFrame();
  const rotation = interpolate(frame, [0, 150], [0, 360]);

  return (
    <AbsoluteFill>
      {/* Dark purple base */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, ${COLORS.dark} 0%, #150020 50%, #2D1440 100%)`,
      }} />

      {/* Animated gradient orbs - magenta */}
      <div style={{
        position: 'absolute',
        top: '5%',
        left: '50%',
        transform: `translate(-50%, 0) rotate(${rotation}deg)`,
        width: 600,
        height: 600,
        background: `radial-gradient(circle, ${COLORS.magenta}30 0%, transparent 60%)`,
        filter: 'blur(60px)',
      }} />

      {/* Cyan orb */}
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '20%',
        width: 400,
        height: 400,
        background: `radial-gradient(circle, ${COLORS.cyan}25 0%, transparent 60%)`,
        filter: 'blur(50px)',
        transform: `rotate(${-rotation}deg)`,
      }} />

      {/* Purple orb */}
      <div style={{
        position: 'absolute',
        top: '30%',
        right: '10%',
        width: 350,
        height: 350,
        background: `radial-gradient(circle, ${COLORS.purple}25 0%, transparent 60%)`,
        filter: 'blur(45px)',
      }} />

      {/* Grid pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(${COLORS.magenta}08 1px, transparent 1px),
          linear-gradient(90deg, ${COLORS.magenta}08 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        opacity: 0.5,
      }} />
    </AbsoluteFill>
  );
};

// Animated particles - SB LX colors
const Particles = () => {
  const frame = useCurrentFrame();
  const particleColors = [COLORS.magenta, COLORS.cyan, COLORS.purple, COLORS.gold];

  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: (i * 37) % 100,
    delay: i * 5,
    speed: 0.5 + (i % 5) * 0.3,
    size: 2 + (i % 4),
    color: particleColors[i % 4],
  }));

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {particles.map((p) => {
        const y = interpolate(
          (frame + p.delay) % 150,
          [0, 150],
          [110, -10]
        );
        const opacity = interpolate(
          y,
          [-10, 20, 80, 110],
          [0, 0.8, 0.8, 0]
        );

        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${y}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: p.color,
              opacity,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Logo component - SB LX style
const Logo = ({ scale = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 100 },
  });

  const glowIntensity = interpolate(
    Math.sin(frame * 0.1),
    [-1, 1],
    [10, 30]
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      transform: `scale(${logoScale * scale})`,
    }}>
      <div style={{
        fontFamily: 'Orbitron, sans-serif',
        fontSize: 72 * scale,
        fontWeight: 900,
        letterSpacing: '0.1em',
        display: 'flex',
        alignItems: 'center',
      }}>
        <span style={{
          color: COLORS.magenta,
          textShadow: `0 0 ${glowIntensity}px ${COLORS.magenta}`,
        }}>SB</span>
        <span style={{
          color: COLORS.cyan,
          margin: '0 10px',
          textShadow: `0 0 ${glowIntensity * 0.5}px ${COLORS.cyan}`,
        }}>LX</span>
      </div>
      <div style={{
        fontSize: 14 * scale,
        letterSpacing: '0.3em',
        color: COLORS.fuchsia,
        textTransform: 'uppercase',
        marginTop: 5,
        opacity: 0.8,
      }}>
        Quiniela 2026
      </div>
    </div>
  );
};

// Ticket card
const TicketCard = ({ nickname, winner, mvp, totalPoints }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardSpring = spring({
    frame: frame - 20,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  const cardScale = interpolate(cardSpring, [0, 1], [0.8, 1]);
  const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);

  // Handle both "Seahawks" and "Seattle Seahawks" formats
  const isSeahawks = winner?.includes('Seahawks');
  const winnerGradient = isSeahawks
    ? 'linear-gradient(135deg, #002244, #69BE28)'
    : 'linear-gradient(135deg, #002244, #C60C30)';

  return (
    <div style={{
      transform: `scale(${cardScale})`,
      opacity: cardOpacity,
      background: `linear-gradient(135deg, ${COLORS.magenta}15, ${COLORS.purple}10)`,
      backdropFilter: 'blur(20px)',
      borderRadius: 30,
      padding: 30,
      border: `1px solid ${COLORS.magenta}40`,
      boxShadow: `0 0 40px ${COLORS.magenta}30`,
      width: '90%',
      maxWidth: 400,
    }}>
      {/* Nickname */}
      <div style={{
        textAlign: 'center',
        marginBottom: 30,
      }}>
        <div style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          marginBottom: 5,
        }}>
          Predicción de
        </div>
        <div style={{
          fontSize: 36,
          fontWeight: 800,
          color: 'white',
          textShadow: `0 0 20px ${COLORS.magenta}80`,
        }}>
          {nickname}
        </div>
      </div>

      {/* Winner pick */}
      <Sequence from={40}>
        <WinnerSection winner={winner} isSeahawks={isSeahawks} winnerGradient={winnerGradient} />
      </Sequence>

      {/* MVP and Points */}
      <Sequence from={60}>
        <div style={{
          display: 'flex',
          gap: 15,
          marginTop: 20,
        }}>
          <InfoBox label="MVP" value={mvp} color={COLORS.magenta} />
          <InfoBox label="Puntos" value={totalPoints} color={COLORS.cyan} />
        </div>
      </Sequence>

      {/* Tagline */}
      <Sequence from={80}>
        <TagLine />
      </Sequence>
    </div>
  );
};

const WinnerSection = ({ winner, isSeahawks, winnerGradient }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 8, stiffness: 100 },
  });

  // Shorten team name for display
  const displayName = winner?.includes('Seahawks') ? 'Seahawks' :
                      winner?.includes('Patriots') ? 'Patriots' : winner;

  return (
    <div style={{
      background: winnerGradient,
      borderRadius: 20,
      padding: 25,
      textAlign: 'center',
      transform: `scale(${interpolate(scale, [0, 1], [0.9, 1])})`,
      opacity: interpolate(scale, [0, 1], [0, 1]),
      boxShadow: `0 0 30px ${isSeahawks ? 'rgba(105,190,40,0.4)' : 'rgba(198,12,48,0.4)'}`,
    }}>
      <div style={{
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        marginBottom: 10,
      }}>
        Ganador Super Bowl LX
      </div>
      <div style={{
        fontSize: 42,
        fontWeight: 900,
        color: 'white',
        textShadow: '0 0 20px rgba(255,255,255,0.5)',
      }}>
        {displayName}
      </div>
    </div>
  );
};

const InfoBox = ({ label, value, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 100 },
  });

  return (
    <div style={{
      flex: 1,
      background: `${color}15`,
      borderRadius: 15,
      padding: 15,
      textAlign: 'center',
      border: `1px solid ${color}40`,
      transform: `scale(${interpolate(scale, [0, 1], [0.8, 1])})`,
      opacity: interpolate(scale, [0, 1], [0, 1]),
    }}>
      <div style={{
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        marginBottom: 5,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 20,
        fontWeight: 700,
        color,
      }}>
        {value}
      </div>
    </div>
  );
};

const TagLine = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 100 },
  });

  const pulse = interpolate(
    Math.sin(frame * 0.15),
    [-1, 1],
    [0.95, 1.05]
  );

  return (
    <div style={{
      marginTop: 25,
      textAlign: 'center',
      transform: `scale(${interpolate(scale, [0, 1], [0.8, 1]) * pulse})`,
      opacity: interpolate(scale, [0, 1], [0, 1]),
    }}>
      <div style={{
        fontSize: 24,
        fontWeight: 800,
        background: `linear-gradient(90deg, ${COLORS.magenta}, ${COLORS.cyan})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textShadow: 'none',
      }}>
        ¡Voy por el Bote!
      </div>
      <div style={{
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        marginTop: 8,
      }}>
        8 de Febrero, 2026 • Levi's Stadium
      </div>
    </div>
  );
};

// Main composition
export const TicketComposition = ({ nickname, winner, mvp, totalPoints }) => {
  // Provide defaults for undefined values
  const safeNickname = nickname || 'Participante';
  const safeWinner = winner || 'Sin elegir';
  const safeMvp = mvp || '-';
  const safeTotalPoints = totalPoints || '-';

  return (
    <AbsoluteFill style={{
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <AnimatedBackground />
      <Particles />

      <AbsoluteFill style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
      }}>
        {/* Logo */}
        <Sequence from={0} durationInFrames={150}>
          <div style={{ marginBottom: 40 }}>
            <Logo scale={0.8} />
          </div>
        </Sequence>

        {/* Ticket */}
        <Sequence from={15} durationInFrames={135}>
          <TicketCard
            nickname={safeNickname}
            winner={safeWinner}
            mvp={safeMvp}
            totalPoints={safeTotalPoints}
          />
        </Sequence>
      </AbsoluteFill>

      {/* Watermark */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 10,
        color: COLORS.magenta,
        letterSpacing: '0.2em',
        opacity: 0.5,
      }}>
        QUINIELA SB LX • 2026
      </div>
    </AbsoluteFill>
  );
};

export default TicketComposition;
