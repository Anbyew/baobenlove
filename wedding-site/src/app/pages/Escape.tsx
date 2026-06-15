import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Car, PartyPopper, Luggage, Music, Disc, Camera, Mic2, Flower2, Flag, Sparkles, Cloud, Sun, Tent, Palmtree, X, Check } from 'lucide-react';
import { Reveal } from '../components/Reveal';
import { Textarea } from '../components/ui/textarea';
import { openVenmo } from '../lib/venmo';
import { trackClick } from '../lib/auth';
import { fetchEscapeCleared, clearEscapeObstacle, type EscapeClearedState } from '../lib/escape';
import { useGuestIdentity } from '../context/GuestIdentityContext';

// ─── Types & Data ───────────────────────────────────────────────────────────

interface Obstacle {
  id: string;
  icon: typeof Car;
  label: string;
  caption: string;
  price: number;
}

const OBSTACLES: Obstacle[] = [
  { id: 'uber', icon: Car, label: 'The Uber That\'s "3 Minutes Away"', caption: '...for the last 45 minutes. We believe in it.', price: 20 },
  { id: 'inlaws', icon: PartyPopper, label: 'In-Laws Reloading Confetti Cannons', caption: 'Round two is loading.', price: 30 },
  { id: 'passport', icon: Luggage, label: 'Forgotten Passport Run', caption: "It's in the other car. The one in Michigan.", price: 50 },
  { id: 'dj', icon: Music, label: 'DJ: "One More Song!"', caption: 'Third encore of the Cha Cha Slide.', price: 30 },
  { id: 'tire', icon: Disc, label: 'Flat Tire on the Getaway Car', caption: 'Of course. Of course it is.', price: 40 },
  { id: 'photographer', icon: Camera, label: '"Just One More Pose!"', caption: 'Group photo #47 — everyone squeeze in.', price: 25 },
  { id: 'toast', icon: Mic2, label: "The Toast That Won't End", caption: 'Uncle Steve still has the mic.', price: 35 },
  { id: 'bouquet', icon: Flower2, label: 'Bouquet Toss, Take 3', caption: "Someone definitely wasn't ready.", price: 25 },
];

// Spread obstacles evenly along the road
function obstaclePosition(i: number) {
  const start = 12;
  const end = 88;
  return start + (i / (OBSTACLES.length - 1)) * (end - start);
}

// ─── Dodge Mini-Game ────────────────────────────────────────────────────────
// Tap the obstacle icon as it darts around before time runs out.
// Pricier obstacles need more taps in the same window — harder to clear.

function DodgeGame({ obstacle, onSuccess }: { obstacle: Obstacle; onSuccess: () => void }) {
  const tapsNeeded = Math.min(10, Math.max(6, Math.round(obstacle.price / 6)));
  const timeLimit = 4;
  const minSize = 28;
  const maxSize = 44;
  const [hits, setHits] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [pos, setPos] = useState({ x: 50, y: 40 });
  const [status, setStatus] = useState<'playing' | 'success' | 'fail'>('playing');

  const randomPos = () => ({ x: 8 + Math.random() * 76, y: 6 + Math.random() * 60 });
  const size = Math.max(minSize, maxSize - hits * 2);

  useEffect(() => {
    if (status !== 'playing') return;
    const id = setInterval(() => {
      setTimeLeft(t => {
        const next = t - 0.1;
        if (next <= 0) {
          setStatus('fail');
          return 0;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(id);
  }, [status]);

  // The target darts to a new spot on its own every so often — not just on tap.
  useEffect(() => {
    if (status !== 'playing') return;
    const id = setInterval(() => setPos(randomPos()), 550);
    return () => clearInterval(id);
  }, [status]);

  useEffect(() => {
    if (status === 'playing' && hits >= tapsNeeded) setStatus('success');
  }, [hits, status, tapsNeeded]);

  useEffect(() => {
    if (status !== 'success') return;
    const t = setTimeout(onSuccess, 500);
    return () => clearTimeout(t);
  }, [status, onSuccess]);

  const handleTap = () => {
    setHits(h => h + 1);
    setPos(randomPos());
  };

  const retry = () => {
    setHits(0);
    setTimeLeft(timeLimit);
    setStatus('playing');
    setPos(randomPos());
  };

  if (status === 'fail') {
    return (
      <div className="text-center py-3">
        <p className="text-sm font-light text-foreground/60 mb-3">Not fast enough — the road's still blocked!</p>
        <button
          type="button"
          onClick={retry}
          className="px-5 py-2 rounded-full border border-foreground/15 hover:border-foreground/30 text-foreground/60 text-xs tracking-[0.2em] uppercase font-light transition-colors bg-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-2 text-xs font-light text-foreground/50 tracking-wider">
        <span>Tap {tapsNeeded}x to clear the road</span>
        <span>{hits} / {tapsNeeded}</span>
      </div>
      <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden mb-3">
        <motion.div
          className="h-full bg-secondary/70 rounded-full"
          animate={{ width: `${(timeLeft / timeLimit) * 100}%` }}
          transition={{ duration: 0.1, ease: 'linear' }}
        />
      </div>
      <div className="relative h-28 rounded-xl bg-foreground/5 overflow-hidden mb-3">
        {status === 'success' ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm font-light text-primary">
            Cleared! 🎉
          </div>
        ) : (
          <motion.button
            type="button"
            onClick={handleTap}
            className="absolute rounded-full flex items-center justify-center border-2 border-secondary/60 bg-white shadow-md"
            style={{ width: size, height: size }}
            animate={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            transition={{ type: 'spring', stiffness: 600, damping: 18 }}
            whileTap={{ scale: 0.85 }}
          >
            <obstacle.icon className="w-4 h-4 text-secondary" />
          </motion.button>
        )}
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────

export function Escape() {
  const { identity } = useGuestIdentity();
  const [cleared, setCleared] = useState<EscapeClearedState>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [poofs, setPoofs] = useState<string[]>([]);

  useEffect(() => {
    fetchEscapeCleared().then(setCleared).catch(() => {});
  }, []);

  const clearedCount = Object.keys(cleared).length;
  const progress = clearedCount / OBSTACLES.length;
  const allClear = clearedCount === OBSTACLES.length;

  const carLeft = 5 + progress * 84; // %
  const selected = OBSTACLES.find(o => o.id === selectedId) ?? null;

  const handlePay = (ob: Obstacle) => {
    trackClick({
      sessionToken: identity?.sessionToken,
      label: 'escape_pay_venmo',
      metadata: { obstacle: ob.id, amount: ob.price },
    });
    openVenmo(ob.price, `Krakoff Wedding -- Escape the Reception: ${ob.label} ($${ob.price})`);
  };

  const handleClear = async (ob: Obstacle) => {
    const note = noteDraft.trim();
    setSelectedId(null);
    setPlayingId(null);
    setNoteDraft('');

    try {
      const next = await clearEscapeObstacle(ob.id, note);
      setCleared(next);
    } catch {
      return;
    }

    trackClick({
      sessionToken: identity?.sessionToken,
      label: 'escape_clear_obstacle',
      metadata: { obstacle: ob.id, amount: ob.price, note },
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
                    Escape the Reception
                  </h1>
                </motion.div>
              </div>
              <motion.p
                className="text-sm font-light text-foreground/60 tracking-wider"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Tap an obstacle, then tap fast to clear our path
              </motion.p>
            </div>
          </div>
        </div>

        {/* Content card */}
        <div className="max-w-5xl mx-auto px-4 pb-32">
          <div className="bg-white/85 backdrop-blur-md shadow-2xl shadow-black/5 p-6 md:p-10 rounded-sm">

            {/* The Road */}
            <Reveal delay={0.1}>
              <div className="relative w-full rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.15)]" style={{ aspectRatio: '1000 / 460' }}>

                {/* Sky */}
                <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-sky-100 to-amber-50" />

                {/* Sun */}
                <motion.div
                  className="absolute top-[8%] right-[8%]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                >
                  <Sun className="w-10 h-10 md:w-14 md:h-14 text-amber-300" />
                </motion.div>

                {/* Clouds */}
                <motion.div
                  className="absolute top-[12%] left-[10%]"
                  animate={{ x: [0, 24, 0] }}
                  transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Cloud className="w-10 h-10 md:w-14 md:h-14 text-white/80 fill-white/60" />
                </motion.div>
                <motion.div
                  className="absolute top-[22%] left-[45%]"
                  animate={{ x: [0, -20, 0] }}
                  transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                >
                  <Cloud className="w-8 h-8 md:w-10 md:h-10 text-white/70 fill-white/50" />
                </motion.div>

                {/* Grass */}
                <div className="absolute left-0 right-0 bottom-0 h-[40%] bg-gradient-to-b from-emerald-300 to-emerald-400" />

                {/* Road */}
                <div className="absolute left-0 right-0 bottom-[14%] h-[18%] bg-stone-400/90">
                  <div className="absolute inset-0 flex items-center overflow-hidden">
                    <motion.div
                      className="flex gap-8 whitespace-nowrap pl-4"
                      animate={allClear ? {} : { x: ['0%', '-20%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    >
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div key={i} className="w-10 h-1 rounded-full bg-white/60 shrink-0" />
                      ))}
                    </motion.div>
                  </div>
                </div>

                {/* Reception tent (start) */}
                <div className="absolute left-[2%] bottom-[16%] flex flex-col items-center gap-1 text-foreground/60">
                  <Tent className="w-7 h-7 md:w-10 md:h-10" />
                  <span className="text-[8px] md:text-[10px] tracking-[0.15em] uppercase font-light whitespace-nowrap">Reception</span>
                </div>

                {/* Honeymoon palms (finish) */}
                <div className="absolute right-[1.5%] bottom-[16%] flex items-end gap-1">
                  <Palmtree className="w-7 h-7 md:w-10 md:h-10 text-emerald-700" />
                  <div className="flex flex-col items-center gap-1 text-primary/70 mb-1">
                    <Sparkles className={`w-4 h-4 md:w-5 md:h-5 ${allClear ? 'animate-pulse' : ''}`} />
                    <span className="text-[8px] md:text-[10px] tracking-[0.15em] uppercase font-light whitespace-nowrap">Honeymoon</span>
                  </div>
                </div>

                {/* Obstacles */}
                {OBSTACLES.map((ob, i) => {
                  const isCleared = !!cleared[ob.id];
                  const pos = obstaclePosition(i);
                  if (isCleared) {
                    return (
                      <motion.div
                        key={ob.id}
                        className="absolute bottom-[34%] flex items-center justify-center"
                        style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
                        initial={{ scale: 0, rotate: -30, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 14 }}
                      >
                        <div className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-white/70 border border-primary/30 flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                      </motion.div>
                    );
                  }
                  return (
                    <motion.button
                      key={ob.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(ob.id);
                        setPlayingId(null);
                        setNoteDraft('');
                        trackClick({
                          sessionToken: identity?.sessionToken,
                          label: 'escape_view_obstacle',
                          metadata: { obstacle: ob.id, amount: ob.price },
                        });
                      }}
                      className="absolute bottom-[32%] flex flex-col items-center cursor-pointer"
                      style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
                      animate={{ rotate: [-6, 6, -6], y: [0, -3, 0] }}
                      transition={{ duration: 2 + (i % 3) * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <div className="w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 border-secondary/60 bg-white shadow-md">
                        <ob.icon className="w-4 h-4 md:w-6 md:h-6 text-secondary" />
                      </div>
                      <span className="mt-1 text-sm md:text-base leading-none">${ob.price}</span>
                    </motion.button>
                  );
                })}

                {/* Poof bursts */}
                <AnimatePresence>
                  {poofs.map(id => {
                    const i = OBSTACLES.findIndex(o => o.id === id);
                    const pos = obstaclePosition(i);
                    return (
                      <motion.div
                        key={id}
                        className="absolute bottom-[34%] rounded-full pointer-events-none"
                        style={{
                          left: `${pos}%`,
                          width: 70, height: 70,
                          marginLeft: -35, marginBottom: -16,
                          background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 70%)',
                        }}
                        initial={{ scale: 0.3, opacity: 0.9 }}
                        animate={{ scale: 2, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    );
                  })}
                </AnimatePresence>

                {/* Car */}
                <motion.div
                  className="absolute bottom-[15%]"
                  animate={{ left: `${carLeft}%` }}
                  transition={{ type: 'spring', stiffness: 50, damping: 14 }}
                  style={{ transform: 'translateX(-50%)' }}
                >
                  <motion.div
                    className="relative"
                    animate={allClear ? {} : { y: [0, -4, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Car className="w-10 h-10 md:w-14 md:h-14 text-foreground/80 drop-shadow-lg" />
                    {allClear && (
                      <motion.div
                        className="absolute -top-7 left-1/2 -translate-x-1/2 text-xl"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: -2 }}
                        transition={{ delay: 0.3 }}
                      >
                        🎉
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>

                {/* Selected obstacle popover */}
                <AnimatePresence>
                  {selected && (
                    <motion.div
                      className="absolute inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center p-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => { setSelectedId(null); setPlayingId(null); }}
                    >
                      <motion.div
                        className="relative bg-white rounded-2xl shadow-2xl p-5 md:p-6 w-full max-w-sm"
                        initial={{ scale: 0.85, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => { setSelectedId(null); setPlayingId(null); }}
                          className="absolute top-3 right-3 text-foreground/30 hover:text-foreground/60"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-secondary/60 bg-white shrink-0">
                            <selected.icon className="w-5 h-5 text-secondary" />
                          </div>
                          <div>
                            <h3 className="text-base font-light text-foreground leading-snug">{selected.label}</h3>
                            <p className="text-xs font-light text-foreground/45">{selected.caption}</p>
                          </div>
                        </div>

                        {playingId === selected.id ? (
                          <DodgeGame obstacle={selected} onSuccess={() => handleClear(selected)} />
                        ) : (
                          <>
                            <Textarea
                              value={noteDraft}
                              onChange={e => setNoteDraft(e.target.value)}
                              placeholder="Leave a snarky note (optional)"
                              className="text-sm font-light bg-white resize-none mb-3"
                              rows={2}
                              maxLength={120}
                            />

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handlePay(selected)}
                                className="flex-1 py-2.5 rounded-full bg-primary/90 hover:bg-primary text-white text-xs tracking-[0.2em] uppercase font-light transition-colors"
                              >
                                Pay ${selected.price} with Venmo
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
                          </>
                        )}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>

            {/* Progress */}
            <Reveal delay={0.15}>
              <div className="flex items-center gap-4 mt-6 max-w-md mx-auto">
                <Flag className="w-4 h-4 text-foreground/30 shrink-0" />
                <div className="flex-1 h-2 rounded-full bg-foreground/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-primary/70 rounded-full"
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ type: 'spring', stiffness: 50, damping: 14 }}
                  />
                </div>
                <span className="text-xs font-light text-foreground/50 tracking-wider whitespace-nowrap">
                  {clearedCount} / {OBSTACLES.length} cleared
                </span>
              </div>
            </Reveal>

            {allClear && (
              <Reveal>
                <p className="text-center text-sm font-light text-primary/80 mt-6">
                  The road is clear — thank you for helping us make a (relatively) graceful exit. 🚗💨
                </p>
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
