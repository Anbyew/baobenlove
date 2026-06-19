import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useAnimationControls } from 'motion/react';
import { Car, PartyPopper, Music, Disc, Mic2, Eye, PlayCircle, Zap, Flag, Sparkles, X, Check } from 'lucide-react';
import { Reveal } from '../components/Reveal';
import { JumpGame, MODES } from '../components/JumpGame';
import { openVenmo } from '../lib/venmo';
import { trackClick, resetEscape, getEscapeSessions, type EscapeSession } from '../lib/auth';
import { fetchEscapeCleared, clearEscapeObstacle, type EscapeClearedState } from '../lib/escape';
import { useGuestIdentity } from '../context/GuestIdentityContext';

// ─── Types & Data ───────────────────────────────────────────────────────────

interface Obstacle {
  id: string;
  icon: typeof Car;
  label: string;
  caption: string;
  price: number;
  image: string;
}

const OBSTACLES: Obstacle[] = [
  { id: 'tutorial', icon: PlayCircle, label: '47 YouTube Tutorials Later',        caption: 'Not one of them helped. Not one.',                               price: 20, image: '/AI/BenDance/youtube.png'  },
  { id: 'toes',    icon: Zap,         label: "Yuwei's Toes",                      caption: 'She has signed a liability waiver. We asked her to.',            price: 25, image: '/AI/BenDance/steptoe.png'  },
  { id: 'warmup',  icon: Music,       label: 'The Pre-Dance Pep Talk',            caption: 'Ben needs to hear it from literally anyone other than himself.', price: 30, image: '/AI/BenDance/prepTalk.png' },
  { id: 'crowd',   icon: Eye,         label: '200 People Are Watching',           caption: "Ben's face has temporarily stopped working.",                    price: 25, image: '/AI/BenDance/200ppl.png'   },
  { id: 'dip',     icon: Sparkles,    label: 'The Dip',                           caption: "Yuwei's safety is technically in your hands. No pressure.",     price: 40, image: '/AI/BenDance/dip.png'      },
  { id: 'mom',     icon: PartyPopper, label: 'Mom Is Already on the Dance Floor', caption: 'There is no stopping her now.',                                  price: 30, image: '/AI/BenDance/mom.png'      },
  { id: 'spin',    icon: Disc,        label: "Someone Yelled 'Do the Thing!'",    caption: 'There is no thing. Ben must invent one on the spot.',            price: 35, image: '/AI/BenDance/theThing.png' },
  { id: 'encore',  icon: Mic2,        label: 'Yuwei Wants an Encore',             caption: "Ben's knees have filed a formal complaint.",                    price: 50, image: '/AI/BenDance/encore.png'   },
];

// ring/bg/icon kept for the popover; glow + dot used for bubble & confetti
const OBSTACLE_THEMES = [
  { ring: 'border-sky-300',     bg: 'bg-sky-50',     icon: 'text-sky-500',     dot: 'bg-sky-300',     glow: 'rgba(125,211,252,0.55)'  },
  { ring: 'border-rose-300',    bg: 'bg-rose-50',    icon: 'text-rose-500',    dot: 'bg-rose-300',    glow: 'rgba(251,113,133,0.55)'  },
  { ring: 'border-amber-300',   bg: 'bg-amber-50',   icon: 'text-amber-500',   dot: 'bg-amber-300',   glow: 'rgba(252,211,77,0.55)'   },
  { ring: 'border-emerald-300', bg: 'bg-emerald-50', icon: 'text-emerald-500', dot: 'bg-emerald-300', glow: 'rgba(52,211,153,0.55)'   },
  { ring: 'border-violet-300',  bg: 'bg-violet-50',  icon: 'text-violet-500',  dot: 'bg-violet-300',  glow: 'rgba(167,139,250,0.55)'  },
  { ring: 'border-orange-300',  bg: 'bg-orange-50',  icon: 'text-orange-500',  dot: 'bg-orange-300',  glow: 'rgba(251,146,60,0.55)'   },
  { ring: 'border-pink-300',    bg: 'bg-pink-50',    icon: 'text-pink-500',    dot: 'bg-pink-300',    glow: 'rgba(249,168,212,0.55)'  },
  { ring: 'border-teal-300',    bg: 'bg-teal-50',    icon: 'text-teal-500',    dot: 'bg-teal-300',    glow: 'rgba(94,234,212,0.55)'   },
];

const CONFETTI_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

// rangeX/rangeY: max pixel displacement from base position in each direction.
// Edge-adjacent bubbles (pos 4, 6) get smaller ranges to avoid overflow-hidden clipping.
const OBSTACLE_POSITIONS = [
  { left: '16%', top: '22%', size: 'w-20 h-20 md:w-24 md:h-24', icon: 'w-7 h-7 md:w-8 md:h-8', rotate: -9,  rangeX: 65, rangeY: 45 },
  { left: '33%', top: '17%', size: 'w-16 h-16 md:w-20 md:h-20', icon: 'w-6 h-6 md:w-7 md:h-7', rotate:  7,  rangeX: 85, rangeY: 55 },
  { left: '54%', top: '20%', size: 'w-24 h-24 md:w-28 md:h-28', icon: 'w-9 h-9 md:w-10 md:h-10',rotate: -4,  rangeX: 70, rangeY: 45 },
  { left: '74%', top: '18%', size: 'w-16 h-16 md:w-20 md:h-20', icon: 'w-6 h-6 md:w-7 md:h-7', rotate: 12,  rangeX: 75, rangeY: 50 },
  { left: '86%', top: '22%', size: 'w-20 h-20 md:w-24 md:h-24', icon: 'w-7 h-7 md:w-8 md:h-8', rotate: -6,  rangeX: 50, rangeY: 45 },
  { left: '18%', top: '68%', size: 'w-20 h-20 md:w-24 md:h-24', icon: 'w-7 h-7 md:w-8 md:h-8', rotate:  5,  rangeX: 65, rangeY: 40 },
  { left: '44%', top: '72%', size: 'w-24 h-24 md:w-28 md:h-28', icon: 'w-9 h-9 md:w-10 md:h-10',rotate: -8,  rangeX: 60, rangeY: 32 },
  { left: '67%', top: '67%', size: 'w-16 h-16 md:w-20 md:h-20', icon: 'w-6 h-6 md:w-7 md:h-7', rotate:  8,  rangeX: 80, rangeY: 45 },
];

// ─── Wandering Bubble ─────────────────────────────────────────────────────────
// Each bubble picks a new random destination inside its allowed range and glides
// there, then picks another — giving genuine free-floating instead of looping oscillation.

interface BubbleObstacleProps {
  ob: Obstacle;
  i: number;
  isCleared: boolean;
  theme: typeof OBSTACLE_THEMES[0];
  pos: typeof OBSTACLE_POSITIONS[0];
  sessionToken: string | undefined;
  onSelect: (id: string) => void;
}

function BubbleObstacle({ ob, i, isCleared, theme, pos, sessionToken, onSelect }: BubbleObstacleProps) {
  const controls = useAnimationControls();

  useEffect(() => {
    let active = true;
    const rand = (r: number) => (Math.random() * 2 - 1) * r;

    (async () => {
      if (isCleared) {
        // Fade in first, staggered by index
        await controls.start({
          scale: 1, opacity: 1,
          transition: { duration: 0.45, ease: 'easeOut', delay: i * 0.1 },
        });
      } else {
        // Stagger first move so all bubbles don't drift simultaneously
        await new Promise<void>(res => setTimeout(res, i * 280 + Math.random() * 450));
      }
      while (active) {
        const dur = 3.8 + Math.random() * 4.2;
        try {
          await controls.start({
            x: rand(pos.rangeX),
            y: rand(pos.rangeY),
            transition: { duration: dur, ease: 'easeInOut' },
          });
        } catch { break; }
      }
    })();

    return () => { active = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const baseStyle: React.CSSProperties = {
    left: pos.left, top: pos.top,
    rotate: `${pos.rotate}deg`,
    translateX: '-50%', translateY: '-50%',
  };

  if (isCleared) {
    return (
      <motion.div
        className={`absolute ${pos.size} rounded-full flex items-center justify-center overflow-hidden`}
        style={{
          ...baseStyle,
          background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
        initial={{ scale: 1.2, opacity: 0 }}
        animate={controls}
      >
        <Check className="w-5 h-5 md:w-6 md:h-6 text-white/25" />
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={() => {
        onSelect(ob.id);
        trackClick({ sessionToken, label: 'escape_view_obstacle', metadata: { obstacle: ob.id, amount: ob.price } });
      }}
      className={`absolute ${pos.size} rounded-full flex items-center justify-center cursor-pointer overflow-hidden`}
      style={{
        ...baseStyle,
        background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.22), rgba(255,255,255,0.05))',
        border: '1px solid rgba(255,255,255,0.28)',
        boxShadow: `0 8px 40px rgba(0,0,0,0.2), 0 0 35px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.45)`,
        backdropFilter: 'blur(6px)',
      }}
      animate={controls}
      whileTap={{ scale: 0.88 }}
    >
      <div className="absolute top-[12%] left-[18%] w-[38%] h-[22%] rounded-full bg-white/50 blur-[3px] pointer-events-none" />
      <ob.icon className={`relative z-10 ${pos.icon} text-white/85 drop-shadow`} />
    </motion.button>
  );
}

function benEmoji(clearedCount: number, allClear: boolean) {
  if (allClear) return '🕺';
  if (clearedCount >= 6) return '😄';
  if (clearedCount >= 4) return '🙂';
  if (clearedCount >= 2) return '😐';
  return '😰';
}

// ─── Main Page ────────────────────────────────────────────────────────────

export function Escape() {
  const { identity } = useGuestIdentity();
  const [cleared, setCleared] = useState<EscapeClearedState>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [poofs, setPoofs] = useState<string[]>([]);
  const [myClearances, setMyClearances] = useState<Set<string>>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('baoben_dance_clearances') || '[]');
      return new Set(Array.isArray(stored) ? stored : []);
    } catch { return new Set(); }
  });

  const [sessions, setSessions] = useState<EscapeSession[]>([]);

  useEffect(() => {
    fetchEscapeCleared().then(setCleared).catch(() => {});
    getEscapeSessions().then(setSessions).catch(() => {});
  }, []);

  const handleReset = async () => {
    if (!identity?.sessionToken) return;
    if (!confirm('Start a new round? The current round will be saved to history and the road resets for everyone.')) return;
    try {
      await resetEscape(identity.sessionToken);
      const [newSessions] = await Promise.all([getEscapeSessions(), fetchEscapeCleared().then(setCleared)]);
      setSessions(newSessions);
    } catch {
      alert('Could not reset. Please try again.');
    }
  };

  const clearedCount = Object.keys(cleared).length;
  const progress = clearedCount / OBSTACLES.length;
  const allClear = clearedCount === OBSTACLES.length;

  const selectedIndex = OBSTACLES.findIndex(o => o.id === selectedId);
  const selected = selectedIndex >= 0 ? OBSTACLES[selectedIndex] : null;

  const handlePay = (ob: Obstacle) => {
    trackClick({
      sessionToken: identity?.sessionToken,
      label: 'escape_pay_venmo',
      metadata: { obstacle: ob.id, amount: ob.price },
    });
    openVenmo(ob.price, `Krakoff Wedding -- SOS: Ben Can't Dance: ${ob.label} ($${ob.price})`);
  };

  const handleClear = async (ob: Obstacle) => {
    setSelectedId(null);
    setPlayingId(null);

    try {
      const next = await clearEscapeObstacle(ob.id, '');
      setCleared(next);
    } catch {
      return;
    }

    trackClick({
      sessionToken: identity?.sessionToken,
      label: 'escape_clear_obstacle',
      metadata: { obstacle: ob.id, amount: ob.price },
    });

    setMyClearances(prev => {
      const next = new Set(prev);
      next.add(ob.id);
      try { localStorage.setItem('baoben_dance_clearances', JSON.stringify([...next])); } catch {}
      return next;
    });

    setPoofs(prev => [...prev, ob.id]);
    setTimeout(() => setPoofs(prev => prev.filter(id => id !== ob.id)), 800);
  };

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <img src="/Wedding Cherries Web/IMG_0267.jpg" alt="background" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/20 to-white/40" />
      </div>

      <div className="relative z-10">
        {/* Hero */}
        <div className="relative py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-sm" />
            <div className="relative">
              <motion.div
                className="h-px w-16 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-10"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.1 }}
              />
              <div className="overflow-hidden mb-4">
                <motion.div
                  initial={{ y: '110%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h1 className="text-5xl md:text-7xl font-light text-foreground tracking-tight">
                    SOS: Ben Can't Dance
                  </h1>
                </motion.div>
              </div>
              <motion.p
                className="text-sm font-light text-foreground/60 tracking-wider"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                The first dance is 20 minutes away. Send a boost. Save the evening.
              </motion.p>
            </div>
          </div>
        </div>

        {/* Content card */}
        <div className="max-w-5xl mx-auto px-4 pb-32">
          <div className="bg-white/85 backdrop-blur-md shadow-2xl shadow-black/5 p-6 md:p-10 rounded-sm">

            {/* Dance Floor Scene */}
            <Reveal delay={0.1}>
              <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '1000 / 460' }}>

                {/* Dark dance floor */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-800 via-slate-900 to-black" />
                <img src="/AI/BenDance/cantDance.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />

                {/* Floor tile grid */}
                <div
                  className="absolute inset-0 opacity-[0.06]"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                  }}
                />

                {/* Dance illustration — black background knocks out via screen blend on dark scene */}
                <img
                  src="/AI/dance.png"
                  alt=""
                  className="absolute right-0 bottom-0 h-full object-contain object-right-bottom opacity-60 pointer-events-none select-none"
                  style={{ mixBlendMode: 'screen' }}
                />

                {/* Spotlight — brightens as confidence rises */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 110%, rgba(120,183,208,0.45), transparent 70%)' }}
                  animate={{ opacity: 0.25 + progress * 0.75 }}
                  transition={{ type: 'spring', stiffness: 40, damping: 16 }}
                />

                {/* Disco sparkle — appears at halfway */}
                <AnimatePresence>
                  {clearedCount >= 4 && (
                    <motion.div
                      className="absolute top-3 right-4 pointer-events-none"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ type: 'spring' }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
                      >
                        <Sparkles className={`w-5 h-5 md:w-7 md:h-7 text-amber-300/70 ${allClear ? 'animate-pulse' : ''}`} />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Inner layout — everything absolute so obstacles can scatter freely */}
                <div className="relative h-full">

                  {/* Scattered obstacle bubbles — each wanders freely via BubbleObstacle */}
                  {OBSTACLES.map((ob, i) => (
                    <BubbleObstacle
                      key={ob.id}
                      ob={ob}
                      i={i}
                      isCleared={!!cleared[ob.id]}
                      theme={OBSTACLE_THEMES[i % OBSTACLE_THEMES.length]}
                      pos={OBSTACLE_POSITIONS[i]}
                      sessionToken={identity?.sessionToken}
                      onSelect={(id) => { setSelectedId(id); setPlayingId(null); }}
                    />
                  ))}

                  {/* Per-guest boost count */}
                  <div className="absolute bottom-3 right-4">
                    <span className="text-[9px] md:text-[11px] text-white/30 tracking-wider">
                      {myClearances.size > 0
                        ? `You've boosted Ben ${myClearances.size}×`
                        : 'Tap a bubble to send a boost'}
                    </span>
                  </div>
                </div>

                {/* Confetti bursts */}
                <AnimatePresence>
                  {poofs.map(id => {
                    const i = OBSTACLES.findIndex(o => o.id === id);
                    const { left, top } = OBSTACLE_POSITIONS[i];
                    const theme = OBSTACLE_THEMES[i % OBSTACLE_THEMES.length];
                    return (
                      <div key={id} className="absolute pointer-events-none" style={{ left, top, transform: 'translate(-50%, -50%)' }}>
                        <motion.div
                          className="absolute rounded-full"
                          style={{
                            width: 64, height: 64, marginLeft: -32, marginTop: -32,
                            background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)',
                          }}
                          initial={{ scale: 0.3, opacity: 0.9 }}
                          animate={{ scale: 2.5, opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.7, ease: 'easeOut' }}
                        />
                        {CONFETTI_ANGLES.map(angle => {
                          const rad = (angle * Math.PI) / 180;
                          const dx = Math.cos(rad) * 40;
                          const dy = Math.sin(rad) * 40;
                          return (
                            <motion.div
                              key={angle}
                              className={`absolute w-2 h-2 rounded-full ${theme.dot}`}
                              style={{ marginLeft: -4, marginTop: -4 }}
                              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                              animate={{ x: dx, y: dy, scale: 0.3, opacity: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </AnimatePresence>

              </div>
            </Reveal>

            {/* Selected obstacle popover */}
            <AnimatePresence>
              {selected && (
                <motion.div
                  className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[2px] flex items-center justify-center p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => { setSelectedId(null); setPlayingId(null); }}
                >
                  <motion.div
                    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden data-[playing=true]:max-w-xl transition-[max-width]"
                    data-playing={playingId === selected.id}
                    initial={{ scale: 0.85, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Close button floats over the hero image */}
                    <button
                      type="button"
                      onClick={() => { setSelectedId(null); setPlayingId(null); }}
                      className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-black/30 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    {/* Hero illustration — dark dance-floor backdrop unifies all 8 images */}
                    {playingId !== selected.id && (
                      <div className="h-56 bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-center">
                        <img
                          src={selected.image}
                          alt={selected.label}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-5 md:p-6">
                      <div className="flex items-center gap-3 mb-1">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 ${OBSTACLE_THEMES[selectedIndex % OBSTACLE_THEMES.length].ring} ${OBSTACLE_THEMES[selectedIndex % OBSTACLE_THEMES.length].bg} shrink-0`}>
                          <selected.icon className={`w-5 h-5 ${OBSTACLE_THEMES[selectedIndex % OBSTACLE_THEMES.length].icon}`} />
                        </div>
                        <div>
                          <h3 className="text-base font-light text-foreground leading-snug">{selected.label}</h3>
                          <p className="text-xs font-light text-foreground/45">{selected.caption}</p>
                        </div>
                      </div>
                      <div className="h-px bg-foreground/10 my-3" />

                      {playingId === selected.id ? (
                        <JumpGame
                          mode={MODES[selectedIndex % MODES.length]}
                          playerIcon={Car}
                          obstacleIcon={selected.icon}
                          goal={Math.min(8, Math.max(4, Math.round(selected.price / 8)))}
                          onSuccess={() => handleClear(selected)}
                        />
                      ) : (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handlePay(selected)}
                            className="flex-1 py-2.5 rounded-full bg-primary/90 hover:bg-primary text-white text-xs tracking-[0.2em] uppercase font-light transition-colors"
                          >
                            Send ${selected.price} via Venmo
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPlayingId(selected.id);
                              trackClick({
                                sessionToken: identity?.sessionToken,
                                label: 'escape_play_game',
                                metadata: { obstacle: selected.id, amount: selected.price },
                              });
                            }}
                            className="px-4 py-2.5 rounded-full border border-foreground/15 hover:border-foreground/30 text-foreground/60 text-xs tracking-[0.2em] uppercase font-light transition-colors bg-white whitespace-nowrap"
                          >
                            Play to Clear
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress */}
            <Reveal delay={0.15}>
              <div className="mt-6 space-y-2 max-w-md mx-auto">
                <div className="flex items-center gap-4">
                  <Flag className="w-4 h-4 text-foreground/30 shrink-0" />
                  <div className="flex-1 h-2 rounded-full bg-foreground/10 overflow-hidden">
                    <motion.div
                      className="h-full bg-primary/70 rounded-full"
                      animate={{ width: `${progress * 100}%` }}
                      transition={{ type: 'spring', stiffness: 50, damping: 14 }}
                    />
                  </div>
                  <span className="text-xs font-light text-foreground/50 tracking-wider whitespace-nowrap">
                    Ben's Confidence · {clearedCount}/{OBSTACLES.length} boosts
                  </span>
                </div>
              </div>
            </Reveal>

            {allClear && (
              <Reveal>
                <p className="text-center text-sm font-light text-primary/80 mt-6">
                  Ben survived the first dance — and honestly? It was beautiful. You are all heroes. 💃
                </p>
              </Reveal>
            )}

            {/* Reset + session history */}
            {identity && (
              <Reveal>
                <div className="mt-8 border-t border-foreground/10 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs tracking-[0.2em] uppercase text-foreground/30">
                      {sessions.length > 0 ? `${sessions.length} previous round${sessions.length !== 1 ? 's' : ''}` : 'Rounds'}
                    </p>
                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={clearedCount === 0}
                      className="text-xs px-3 py-1.5 rounded-full border border-foreground/15 hover:border-primary/40 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed text-foreground/40 tracking-wider uppercase font-light transition-colors"
                    >
                      New round
                    </button>
                  </div>
                  {sessions.length > 0 && (
                    <div className="space-y-2">
                      {sessions.map(s => (
                        <div key={s.id} className="border border-foreground/10 rounded px-3 py-2.5 text-xs">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-normal text-foreground/70">Round {s.session_number}</span>
                            <span className="text-foreground/30">
                              {new Date(s.archived_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-foreground/50">{s.obstacles.length} / {OBSTACLES.length} obstacles cleared</span>
                            <span className="text-primary/70 font-normal">${s.total_raised} raised</span>
                          </div>
                          {s.obstacles.some(o => o.note) && (
                            <div className="mt-2 space-y-1">
                              {s.obstacles.filter(o => o.note).map((o, i) => (
                                <p key={i} className="text-foreground/40 italic">"{o.note}" — on {o.id}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Reveal>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
