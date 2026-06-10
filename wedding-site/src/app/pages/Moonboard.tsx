import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Reveal } from '../components/Reveal';
import { fetchMoonboardHolds, placeMoonboardHold, type MoonboardHold } from '../lib/moonboard';

// ─── Types ────────────────────────────────────────────────────────────────────

type HoldShape = 'jug' | 'crimp' | 'sloper' | 'pinch' | 'pocket';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLS = 11;
const ROWS = 18;
const CELL = 40;
const GAP = 4;
const BOARD_PADDING = 16;
const HOLD_PRICE = 25;
const DRAG_MIME = 'application/x-moonboard-hold';

const COLORS = [
  { name: 'Dusty Blue', hex: '#78B7D0' },
  { name: 'Ocean',      hex: '#4A8FAE' },
  { name: 'Powder',     hex: '#BFE1ED' },
  { name: 'Gold',       hex: '#FFDC7F' },
  { name: 'Amber',      hex: '#E0A23D' },
  { name: 'Sage',       hex: '#A3B899' },
  { name: 'Blush',      hex: '#E3B8B0' },
  { name: 'Ivory',      hex: '#F2E6D0' },
];

const SHAPES: Array<{ id: HoldShape; label: string }> = [
  { id: 'jug',    label: 'Jug'    },
  { id: 'crimp',  label: 'Crimp'  },
  { id: 'sloper', label: 'Sloper' },
  { id: 'pinch',  label: 'Pinch'  },
  { id: 'pocket', label: 'Pocket' },
];

// ─── SVG Holds ────────────────────────────────────────────────────────────────

function HoldSVG({ shape, color, size = 28 }: { shape: HoldShape | string; color: string; size?: number }) {
  const stroke = 'rgba(0,0,0,0.4)';
  const hi = 'rgba(255,255,255,0.35)';
  const shad = 'rgba(0,0,0,0.2)';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      style={{ display: 'block', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
    >
      {shape === 'jug' && <>
        <ellipse cx="14" cy="19" rx="11" ry="7.5" fill={color} stroke={stroke} strokeWidth="1.2" />
        <path d="M3 19 C3 10 14 7 14 7 C14 7 25 10 25 19" fill={color} stroke={stroke} strokeWidth="1.2" />
        <path d="M6 19 C6 13 14 11 14 11 C14 11 22 13 22 19" fill={shad} />
        <ellipse cx="10" cy="10" rx="2.5" ry="1.5" fill={hi} transform="rotate(-20 10 10)" />
      </>}
      {shape === 'crimp' && <>
        <rect x="2" y="15" width="24" height="9" rx="3" fill={color} stroke={stroke} strokeWidth="1.2" />
        <rect x="4" y="13" width="20" height="6" rx="2" fill={color} stroke={stroke} strokeWidth="1.2" />
        <rect x="6" y="14" width="8" height="1.5" rx="0.75" fill={hi} />
      </>}
      {shape === 'sloper' && <>
        <path d="M2 22 C2 22 2 7 14 5 C26 7 26 22 26 22 Z" fill={color} stroke={stroke} strokeWidth="1.2" />
        <ellipse cx="14" cy="22" rx="12" ry="5" fill={color} stroke={stroke} strokeWidth="1.2" />
        <ellipse cx="10" cy="10" rx="3" ry="2" fill={hi} transform="rotate(-15 10 10)" />
      </>}
      {shape === 'pinch' && <>
        <ellipse cx="14" cy="14" rx="6.5" ry="11.5" fill={color} stroke={stroke} strokeWidth="1.2" />
        <ellipse cx="14" cy="14" rx="3.5" ry="7" fill={shad} />
        <ellipse cx="11.5" cy="7" rx="2" ry="1.5" fill={hi} />
      </>}
      {shape === 'pocket' && <>
        <ellipse cx="14" cy="15" rx="12.5" ry="10.5" fill={color} stroke={stroke} strokeWidth="1.2" />
        <ellipse cx="14" cy="16" rx="6.5" ry="5.5" fill={shad} />
        <ellipse cx="14" cy="16.5" rx="3.8" ry="3.2" fill="rgba(0,0,0,0.5)" />
        <ellipse cx="11" cy="12" rx="2.5" ry="1.5" fill={hi} />
      </>}
    </svg>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function ShapeButton({ shape, selected, color, onSelect }: {
  shape: HoldShape; selected: boolean; color: string; onSelect: () => void;
}) {
  const label = SHAPES.find(s => s.id === shape)!.label;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`p-2 rounded flex flex-col items-center gap-1 border transition-all ${
        selected
          ? 'border-primary/40 bg-primary/5'
          : 'border-foreground/10 hover:border-foreground/20'
      }`}
    >
      <HoldSVG shape={shape} color={selected ? color : '#9ca3af'} size={24} />
      <span className="text-[10px] font-light text-foreground/60">{label}</span>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function Moonboard() {
  const [holds, setHolds] = useState<MoonboardHold[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [viewingHold, setViewingHold] = useState<MoonboardHold | null>(null);

  // Builder state
  const [name, setName]       = useState('');
  const [message, setMessage] = useState('');
  const [shape, setShape]     = useState<HoldShape>('jug');
  const [color, setColor]     = useState(COLORS[0].hex);
  const [nameError, setNameError] = useState(false);

  const [dragOverCell, setDragOverCell] = useState<{ row: number; col: number } | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMoonboardHolds()
      .then(data => { if (!cancelled) setHolds(data); })
      .catch(err => { if (!cancelled) setLoadError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const holdMap = new Map(holds.map(h => [`${h.row},${h.col}`, h]));

  const tryPlace = async (row: number, col: number) => {
    if (placing) return;
    if (holdMap.has(`${row},${col}`)) return;
    if (!name.trim()) {
      setNameError(true);
      return;
    }

    setPlacing(true);
    setPlaceError(null);
    try {
      const hold = await placeMoonboardHold({
        row, col,
        guestName: name.trim(),
        message: message.trim(),
        shape,
        color,
      });
      setHolds(prev => [...prev, hold]);
      setMessage('');
    } catch (err) {
      setPlaceError(err instanceof Error ? err.message : 'Could not place your hold.');
      // Someone may have just taken this (or another) spot — refresh the board.
      fetchMoonboardHolds().then(setHolds).catch(() => {});
    } finally {
      setPlacing(false);
    }
  };

  const handleCellClick = (row: number, col: number) => {
    const existing = holdMap.get(`${row},${col}`);
    if (existing) {
      setViewingHold(existing);
    } else {
      tryPlace(row, col);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!name.trim()) {
      e.preventDefault();
      setNameError(true);
      return;
    }
    e.dataTransfer.setData(DRAG_MIME, '1');
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDrop = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    setDragOverCell(null);
    if (!e.dataTransfer.types.includes(DRAG_MIME)) return;
    tryPlace(row, col);
  };

  const filledCount = holds.length;
  const remaining   = COLS * ROWS - filledCount;
  const boardW = COLS * CELL + (COLS - 1) * GAP + BOARD_PADDING * 2;
  const canDrag = !!name.trim() && !placing;

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <img
          src="/Wedding Cherries Web/IMG_0267.jpg"
          alt="background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/20 to-white/40" />
      </div>

      <div className="relative z-10">
        {/* Hero */}
        <div className="relative py-32 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-sm" />
            <div className="relative">
              <motion.div
                className="h-px w-16 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-12"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.1 }}
              />
              <div className="overflow-hidden mb-6">
                <motion.div
                  initial={{ y: '110%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h1 className="text-5xl md:text-7xl font-light text-foreground tracking-tight">
                    Moonboard Registry
                  </h1>
                </motion.div>
              </div>
              <motion.p
                className="text-sm font-light text-foreground/60 tracking-wider"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Place a climbing hold · Leave your mark
              </motion.p>
            </div>
          </div>
        </div>

        {/* Content card */}
        <div className="max-w-7xl mx-auto px-4 pb-32">
          <div className="bg-white/85 backdrop-blur-md shadow-2xl shadow-black/5 p-8 md:p-12 rounded-sm">

            {/* Intro */}
            <Reveal>
              <div className="text-center max-w-2xl mx-auto mb-14">
                <p className="text-base font-light text-foreground/80 leading-relaxed">
                  We're building a moonboard — a training wall for our home gym.
                  Place a ${HOLD_PRICE} hold and it becomes a permanent part of it, and our story.
                </p>
              </div>
            </Reveal>

            {/* Stats */}
            <Reveal delay={0.1}>
              <div className="flex justify-center gap-16 mb-14">
                {[
                  { value: filledCount, label: 'Placed' },
                  { value: remaining,   label: 'Available' },
                  { value: COLS * ROWS, label: 'Total' },
                ].map(({ value, label }) => (
                  <div key={label} className="text-center">
                    <div className={`text-3xl font-light mb-1 ${label === 'Placed' ? 'text-primary' : 'text-foreground/40'}`}>
                      {value}
                    </div>
                    <div className="text-xs tracking-wider uppercase text-foreground/50">{label}</div>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* Board + Sidebar */}
            <div className="flex flex-col lg:flex-row gap-12 items-start justify-center">

              {/* The Moonboard */}
              <Reveal direction="left" className="w-full lg:w-auto lg:flex-shrink-0">
                <div className="w-full lg:flex-shrink-0">
                  <div className="text-xs tracking-wider uppercase text-foreground/40 text-center mb-3">
                    40° overhang · {COLS} × {ROWS} · {COLS * ROWS} holds
                  </div>
                  <p className="lg:hidden text-center text-[11px] text-foreground/35 font-light mb-2">
                    Swipe sideways to see the full board →
                  </p>
                  <div className="relative">
                  <div className="overflow-x-auto max-w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <div
                    style={{
                      width: boardW,
                      background: '#1a1a2e',
                      borderRadius: 6,
                      padding: BOARD_PADDING,
                      boxShadow: '0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
                      display: 'grid',
                      gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
                      gap: GAP,
                      position: 'relative',
                      marginInline: 'auto',
                    }}
                  >
                    {loading && (
                      <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm font-light">
                        Loading board…
                      </div>
                    )}
                    {!loading && loadError && (
                      <div className="absolute inset-0 flex items-center justify-center text-center px-6 text-white/50 text-sm font-light">
                        {loadError}
                      </div>
                    )}
                    {Array.from({ length: ROWS }).flatMap((_, row) =>
                      Array.from({ length: COLS }).map((_, col) => {
                        const hold = holdMap.get(`${row},${col}`);
                        const isDragOver = dragOverCell?.row === row && dragOverCell?.col === col;
                        return (
                          <button
                            key={`${row},${col}`}
                            onClick={() => handleCellClick(row, col)}
                            onDragOver={(e) => { if (!hold) e.preventDefault(); }}
                            onDragEnter={() => { if (!hold) setDragOverCell({ row, col }); }}
                            onDragLeave={() => {
                              setDragOverCell(prev => (prev?.row === row && prev?.col === col ? null : prev));
                            }}
                            onDrop={(e) => handleDrop(e, row, col)}
                            title={
                              hold
                                ? `${hold.guestName}${hold.message ? ` — "${hold.message}"` : ''}`
                                : 'Tap to place a hold, or drag one here'
                            }
                            style={{
                              width: CELL,
                              height: CELL,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 4,
                              border: isDragOver ? '1px solid rgba(120,183,208,0.8)' : '1px solid transparent',
                              cursor: hold ? 'pointer' : 'pointer',
                              background: isDragOver
                                ? 'rgba(120,183,208,0.18)'
                                : hold ? 'rgba(255,255,255,0.04)' : 'transparent',
                              padding: 0,
                              opacity: loading ? 0 : 1,
                            }}
                            className="group transition-all duration-150 hover:bg-white/10"
                          >
                            {hold ? (
                              <motion.div
                                initial={{ scale: 0, rotate: -12 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                                className="group-hover:scale-110 transition-transform duration-150"
                              >
                                <HoldSVG shape={hold.shape} color={hold.color} size={30} />
                              </motion.div>
                            ) : (
                              <div
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  background: 'rgba(255,255,255,0.1)',
                                  border: '1px solid rgba(255,255,255,0.07)',
                                }}
                                className="group-hover:bg-white/25 transition-colors duration-150"
                              />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                  </div>
                  <div
                    className="lg:hidden pointer-events-none absolute right-0 top-0 bottom-0 w-10 rounded-r-md"
                    style={{ background: 'linear-gradient(to right, transparent, rgba(26,26,46,0.9))' }}
                  />
                  </div>
                  <p className="text-xs text-center text-foreground/30 mt-3 font-light">
                    Tap an open spot to place your hold · Tap a placed hold to see who placed it
                  </p>
                </div>
              </Reveal>

              {/* Sidebar */}
              <Reveal direction="right" className="w-full lg:flex-1 lg:min-w-0 lg:max-w-sm">
                <div className="space-y-8">

                  {/* Build Your Hold */}
                  <div>
                    <div className="text-xs tracking-[0.3em] uppercase text-primary/55 mb-4 font-light">
                      Build Your Hold
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 mb-4">
                      {SHAPES.map(s => (
                        <ShapeButton
                          key={s.id}
                          shape={s.id}
                          selected={shape === s.id}
                          color={color}
                          onSelect={() => setShape(s.id)}
                        />
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {COLORS.map(c => (
                        <button
                          key={c.hex}
                          type="button"
                          title={c.name}
                          onClick={() => setColor(c.hex)}
                          style={{ backgroundColor: c.hex }}
                          className={`w-7 h-7 rounded-full transition-all duration-150 ${
                            color === c.hex
                              ? 'ring-2 ring-offset-2 ring-foreground/40 scale-110'
                              : 'hover:scale-105'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-4">
                      <div
                        draggable={canDrag}
                        onDragStart={handleDragStart}
                        style={{
                          background: '#1a1a2e',
                          borderRadius: '50%',
                          width: 64,
                          height: 64,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                          flexShrink: 0,
                        }}
                        className={`transition-transform duration-150 ${
                          canDrag ? 'cursor-grab active:cursor-grabbing hover:scale-105' : 'opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <HoldSVG shape={shape} color={color} size={42} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Input
                          value={name}
                          onChange={e => { setName(e.target.value); if (e.target.value.trim()) setNameError(false); }}
                          placeholder="Your name *"
                          className={`font-light mb-2 ${nameError ? 'border-destructive ring-1 ring-destructive/40' : ''}`}
                        />
                        <Input
                          value={message}
                          onChange={e => setMessage(e.target.value)}
                          placeholder="Message (optional)"
                          className="font-light"
                          maxLength={80}
                        />
                      </div>
                    </div>
                    {nameError && (
                      <p className="text-xs text-destructive font-light mt-2">Please enter your name first.</p>
                    )}
                    {placeError && (
                      <p className="text-xs text-destructive font-light mt-2">{placeError}</p>
                    )}
                  </div>

                  <div className="h-px bg-foreground/5" />

                  {/* How it works */}
                  <div>
                    <div className="text-xs tracking-[0.3em] uppercase text-primary/55 mb-4 font-light">
                      How it works
                    </div>
                    <p className="text-sm font-light text-foreground/70 leading-relaxed">
                      Pick a shape and color, add your name, then tap an open spot on the board.
                      Each hold is ${HOLD_PRICE} — Venmo @baobenlove.
                    </p>
                  </div>

                  <div className="h-px bg-foreground/5" />

                  {/* Contributor list */}
                  {holds.length > 0 ? (
                    <div>
                      <div className="text-xs tracking-[0.3em] uppercase text-primary/55 mb-4 font-light">
                        Holds placed ({holds.length})
                      </div>
                      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {[...holds].reverse().map(hold => (
                          <motion.button
                            key={hold.id}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => setViewingHold(hold)}
                            className="flex items-center gap-3 w-full text-left group"
                          >
                            <div className="flex-shrink-0 group-hover:scale-110 transition-transform duration-150">
                              <HoldSVG shape={hold.shape} color={hold.color} size={22} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-light text-foreground/80 truncate">
                                {hold.guestName}
                              </div>
                              {hold.message && (
                                <div className="text-xs font-light text-foreground/50 truncate italic">
                                  "{hold.message}"
                                </div>
                              )}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-light text-foreground/40 italic">
                      {loading ? 'Loading…' : 'No holds placed yet — be the first!'}
                    </p>
                  )}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>

      {/* ── View Hold Modal ── */}
      <Dialog open={!!viewingHold} onOpenChange={() => setViewingHold(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light">{viewingHold?.guestName}</DialogTitle>
          </DialogHeader>
          {viewingHold && (
            <div className="space-y-4 pt-2">
              <div className="flex justify-center">
                <div
                  style={{
                    background: '#1a1a2e',
                    borderRadius: '50%',
                    width: 88,
                    height: 88,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                  }}
                >
                  <HoldSVG shape={viewingHold.shape} color={viewingHold.color} size={56} />
                </div>
              </div>
              {viewingHold.message && (
                <p className="text-sm font-light text-foreground/70 italic">
                  "{viewingHold.message}"
                </p>
              )}
              <p className="text-xs font-light text-foreground/35">
                {new Date(viewingHold.placedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
