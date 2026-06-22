import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Compass, Coffee, Footprints, Megaphone, Cookie, Users, Camera, Flag, Sparkles, Cloud, Sun, Tent, X, Check, PersonStanding } from 'lucide-react';
import { Reveal } from '../components/Reveal';
import { JumpGame, MODES } from '../components/JumpGame';
import { Textarea } from '../components/ui/textarea';
import { openVenmo } from '../lib/venmo';
import { ZelleButton } from '../components/ZelleButton';
import { trackClick } from '../lib/auth';
import { fetchClimbCleared, clearClimbBoost, type ClimbClearedState } from '../lib/climb';
import { useGuestIdentity } from '../context/GuestIdentityContext';

// ─── Types & Data ───────────────────────────────────────────────────────────

interface Boost {
  id: string;
  icon: typeof Zap;
  label: string;
  caption: string;
  price: number;
}

const BOOSTS: Boost[] = [
  { id: 'energybar', icon: Zap, label: 'Emergency Energy Bar', caption: 'Ben forgot to eat breakfast again.', price: 15 },
  { id: 'donut', icon: Cookie, label: 'Donut Bribe', caption: 'Works every time.', price: 20 },
  { id: 'yell', icon: Megaphone, label: 'Motivational Yell from Yuwei', caption: '"YOU CAN DO IT, BEN!" echoes across the valley.', price: 20 },
  { id: 'poles', icon: Compass, label: 'Trekking Poles', caption: 'Apparently these help. Who knew.', price: 25 },
  { id: 'selfiestick', icon: Camera, label: 'Summit Selfie Stick', caption: 'For the inevitable photo.', price: 25 },
  { id: 'coffee', icon: Coffee, label: 'Coffee IV Drip', caption: 'Emergency caffeine infusion.', price: 30 },
  { id: 'boots', icon: Footprints, label: 'New Hiking Boots', caption: 'His sneakers were... not appropriate.', price: 40 },
  { id: 'sherpa', icon: Users, label: 'Sherpa Assist', caption: 'A professional, mercifully.', price: 45 },
];

// Spread boosts along the slope, from base camp (bottom-left) to the summit (top-right)
function boostPosition(i: number) {
  const t = i / (BOOSTS.length - 1);
  return { x: 8 + t * 80, y: 85 - t * 68 };
}

// ─── Main Page ────────────────────────────────────────────────────────────

export function Climb() {
  const { identity } = useGuestIdentity();
  const [cleared, setCleared] = useState<ClimbClearedState>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [poofs, setPoofs] = useState<string[]>([]);

  useEffect(() => {
    fetchClimbCleared().then(setCleared).catch(() => {});
  }, []);

  const clearedCount = Object.keys(cleared).length;
  const progress = clearedCount / BOOSTS.length;
  const summit = clearedCount === BOOSTS.length;

  const benPos = { x: 8 + progress * 80, y: 85 - progress * 68 };
  const selectedIndex = BOOSTS.findIndex(b => b.id === selectedId);
  const selected = selectedIndex >= 0 ? BOOSTS[selectedIndex] : null;

  const closePopover = () => { setSelectedId(null); setPlayingId(null); };

  const handlePay = (boost: Boost) => {
    trackClick({
      sessionToken: identity?.sessionToken,
      label: 'climb_pay_venmo',
      metadata: { boost: boost.id, amount: boost.price },
    });
    openVenmo(boost.price, `Drag Ben Up the Mountain — ${boost.label}`);
  };

  const handleClear = async (boost: Boost) => {
    const note = noteDraft.trim();
    setSelectedId(null);
    setPlayingId(null);
    setNoteDraft('');

    try {
      const next = await clearClimbBoost(boost.id, note);
      setCleared(next);
    } catch {
      return;
    }

    trackClick({
      sessionToken: identity?.sessionToken,
      label: 'climb_clear_boost',
      metadata: { boost: boost.id, amount: boost.price, note },
    });

    setPoofs(prev => [...prev, boost.id]);
    setTimeout(() => setPoofs(prev => prev.filter(id => id !== boost.id)), 800);
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
                    Drag Ben Up the Mountain
                  </h1>
                </motion.div>
              </div>
              <motion.p
                className="text-sm font-light text-foreground/60 tracking-wider"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Tap a boost, then push fast to send Ben up the slope
              </motion.p>
            </div>
          </div>
        </div>

        {/* Content card */}
        <div className="max-w-5xl mx-auto px-4 pb-32">
          <div className="bg-white/85 backdrop-blur-md shadow-2xl shadow-black/5 p-6 md:p-10 rounded-sm">

            {/* The Mountain */}
            <Reveal delay={0.1}>
              <div className="relative w-full rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.15)]" style={{ aspectRatio: '1000 / 460' }}>

                {/* Sky */}
                <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-sky-100 to-slate-100" />

                {/* Sun */}
                <motion.div
                  className="absolute top-[8%] left-[10%]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                >
                  <Sun className="w-10 h-10 md:w-14 md:h-14 text-amber-300" />
                </motion.div>

                {/* Clouds */}
                <motion.div
                  className="absolute top-[14%] left-[40%]"
                  animate={{ x: [0, 24, 0] }}
                  transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Cloud className="w-10 h-10 md:w-14 md:h-14 text-white/80 fill-white/60" />
                </motion.div>
                <motion.div
                  className="absolute top-[24%] left-[68%]"
                  animate={{ x: [0, -20, 0] }}
                  transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                >
                  <Cloud className="w-8 h-8 md:w-10 md:h-10 text-white/70 fill-white/50" />
                </motion.div>

                {/* Back mountain */}
                <div
                  className="absolute inset-x-0 bottom-0 h-[80%]"
                  style={{
                    clipPath: 'polygon(78% 4%, 100% 100%, 30% 100%)',
                    background: 'linear-gradient(to top, #94a3b8, #cbd5e1)',
                  }}
                />

                {/* Main mountain */}
                <div
                  className="absolute inset-x-0 bottom-0 h-[92%]"
                  style={{
                    clipPath: 'polygon(85% 5%, 100% 100%, 0% 100%)',
                    background: 'linear-gradient(to top, #64748b, #94a3b8)',
                  }}
                />

                {/* Snow cap */}
                <div
                  className="absolute inset-x-0 bottom-0 h-[92%]"
                  style={{
                    clipPath: 'polygon(85% 5%, 94% 26%, 76% 26%)',
                    background: 'linear-gradient(to top, #e2e8f0, #ffffff)',
                  }}
                />

                {/* Base camp (start) */}
                <div className="absolute left-[2%] bottom-[10%] flex flex-col items-center gap-1 text-foreground/60">
                  <Tent className="w-7 h-7 md:w-10 md:h-10" />
                  <span className="text-[8px] md:text-[10px] tracking-[0.15em] uppercase font-light whitespace-nowrap">Base Camp</span>
                </div>

                {/* Summit flag (finish) */}
                <div className="absolute right-[2%] top-[2%] flex flex-col items-center gap-1">
                  <Flag className={`w-6 h-6 md:w-8 md:h-8 text-primary/80 ${summit ? 'animate-pulse' : ''}`} />
                  <div className="flex flex-col items-center gap-1 text-primary/70">
                    <Sparkles className={`w-4 h-4 md:w-5 md:h-5 ${summit ? 'animate-pulse' : ''}`} />
                    <span className="text-[8px] md:text-[10px] tracking-[0.15em] uppercase font-light whitespace-nowrap">Honeymoon</span>
                  </div>
                </div>

                {/* Boosts */}
                {BOOSTS.map((boost, i) => {
                  const isCleared = !!cleared[boost.id];
                  const pos = boostPosition(i);
                  if (isCleared) {
                    return (
                      <motion.div
                        key={boost.id}
                        className="absolute flex items-center justify-center"
                        style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
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
                      key={boost.id}
                      type="button"
                      onClick={() => { setSelectedId(boost.id); setPlayingId(null); setNoteDraft(''); }}
                      className="absolute flex flex-col items-center cursor-pointer"
                      style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
                      animate={{ rotate: [-6, 6, -6], y: [0, -3, 0] }}
                      transition={{ duration: 2 + (i % 3) * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <div className="w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 border-secondary/60 bg-white shadow-md">
                        <boost.icon className="w-4 h-4 md:w-6 md:h-6 text-secondary" />
                      </div>
                      <span className="mt-1 text-sm md:text-base leading-none">${boost.price}</span>
                    </motion.button>
                  );
                })}

                {/* Poof bursts */}
                <AnimatePresence>
                  {poofs.map(id => {
                    const i = BOOSTS.findIndex(b => b.id === id);
                    const pos = boostPosition(i);
                    return (
                      <motion.div
                        key={id}
                        className="absolute rounded-full pointer-events-none"
                        style={{
                          left: `${pos.x}%`, top: `${pos.y}%`,
                          width: 70, height: 70,
                          marginLeft: -35, marginTop: -35,
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

                {/* Ben */}
                <motion.div
                  className="absolute"
                  animate={{ left: `${benPos.x}%`, top: `${benPos.y}%` }}
                  transition={{ type: 'spring', stiffness: 50, damping: 14 }}
                  style={{ transform: 'translate(-50%, -50%)' }}
                >
                  <motion.div
                    className="relative text-3xl md:text-4xl drop-shadow-lg"
                    animate={summit ? {} : { y: [0, -4, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    🧗
                    {summit && (
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

              </div>
            </Reveal>

            {/* Selected boost popover — rendered outside the mountain scene so it
                isn't clipped by the scene's overflow-hidden/aspect-ratio box */}
            <AnimatePresence>
              {selected && (
                <motion.div
                  className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[2px] flex items-center justify-center p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={closePopover}
                >
                  <motion.div
                    className="relative bg-white rounded-2xl shadow-2xl p-5 md:p-6 w-full max-w-sm data-[playing=true]:max-w-xl transition-[max-width]"
                    data-playing={playingId === selected.id}
                    initial={{ scale: 0.85, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={closePopover}
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
                      <JumpGame
                        mode={MODES[selectedIndex % MODES.length]}
                        playerIcon={PersonStanding}
                        obstacleIcon={selected.icon}
                        goal={Math.min(8, Math.max(4, Math.round(selected.price / 8)))}
                        onSuccess={() => handleClear(selected)}
                      />
                    ) : (
                      <>
                        <Textarea
                          value={noteDraft}
                          onChange={e => setNoteDraft(e.target.value)}
                          placeholder="Leave an encouraging (or roasting) note (optional)"
                          className="text-sm font-light bg-white resize-none mb-3"
                          rows={2}
                          maxLength={120}
                        />

                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2 items-start">
                            <button
                              type="button"
                              onClick={() => handlePay(selected)}
                              className="flex-1 py-2.5 rounded-full bg-primary/90 hover:bg-primary text-white text-xs tracking-[0.2em] uppercase font-light transition-colors"
                            >
                              ${selected.price} via Venmo
                            </button>
                            <ZelleButton amount={selected.price} note={`Drag Ben Up the Mountain — ${selected.label}`} sessionToken={identity?.sessionToken} />
                          </div>
                          <button
                            type="button"
                            onClick={() => setPlayingId(selected.id)}
                            className="w-full px-4 py-2.5 rounded-full border border-foreground/15 hover:border-foreground/30 text-foreground/60 text-xs tracking-[0.2em] uppercase font-light transition-colors bg-white"
                          >
                            Push to Help
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

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
                  {clearedCount} / {BOOSTS.length} cleared
                </span>
              </div>
            </Reveal>

            {summit && (
              <Reveal>
                <p className="text-center text-sm font-light text-primary/80 mt-6">
                  Ben made it to the summit — thank you for dragging him the whole way. 🧗🎉
                </p>
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
