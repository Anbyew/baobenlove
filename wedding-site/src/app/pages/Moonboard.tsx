import { useState } from 'react';
import { useEffect } from 'react';
import { motion } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Reveal } from '../components/Reveal';
import { fetchMoonboardHolds, placeMoonboardHold, type MoonboardHold } from '../lib/moonboard';
import { openVenmo } from '../lib/venmo';

// ─── Types ────────────────────────────────────────────────────────────────────

type HoldShape = 'jug' | 'crimp' | 'sloper' | 'pinch' | 'pocket';

interface DraftHold {
  id: string;
  shape: HoldShape;
  color: string;
  message: string;
  position: { row: number; col: number } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLS = 11;
const ROWS = 18;
const CELL = 40;
const GAP = 4;
const BOARD_PADDING = 16;
const HOLD_PRICE = 25;
const MAX_QTY = 10;

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

let nextDraftId = 1;
function makeDraft(colorIndex: number): DraftHold {
  return {
    id: `draft-${nextDraftId++}`,
    shape: 'jug',
    color: COLORS[colorIndex % COLORS.length].hex,
    message: '',
    position: null,
  };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function Moonboard() {
  const [holds, setHolds] = useState<MoonboardHold[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [viewingHold, setViewingHold] = useState<MoonboardHold | null>(null);

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState(false);

  const [qty, setQty] = useState(1);
  const [drafts, setDrafts] = useState<DraftHold[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMoonboardHolds()
      .then(data => { if (!cancelled) setHolds(data); })
      .catch(err => { if (!cancelled) setLoadError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const holdMap = new Map(holds.map(h => [`${h.row},${h.col}`, h]));
  const draftMap = new Map(
    drafts.filter(d => d.position).map(d => [`${d.position!.row},${d.position!.col}`, d])
  );

  const active = drafts.find(d => d.id === activeId) ?? drafts[0] ?? null;

  const handleFund = () => {
    const fresh = Array.from({ length: qty }, (_, i) => makeDraft(drafts.length + i));
    setDrafts(prev => [...prev, ...fresh]);
    if (!active) setActiveId(fresh[0].id);
    setQty(1);
  };

  const updateActive = (patch: Partial<DraftHold>) => {
    if (!active) return;
    setDrafts(prev => prev.map(d => d.id === active.id ? { ...d, ...patch } : d));
  };

  const removeDraft = (id: string) => {
    setDrafts(prev => {
      const next = prev.filter(d => d.id !== id);
      if (activeId === id) setActiveId(next[0]?.id ?? null);
      return next;
    });
  };


  const handleCellClick = (row: number, col: number) => {
    const key = `${row},${col}`;
    const submitted = holdMap.get(key);
    if (submitted) {
      setViewingHold(submitted);
      return;
    }

    const draftHere = draftMap.get(key);
    if (draftHere) {
      if (draftHere.id === active?.id) {
        // pick it back up
        setDrafts(prev => prev.map(d => d.id === draftHere.id ? { ...d, position: null } : d));
      } else {
        setActiveId(draftHere.id);
      }
      return;
    }

    // empty cell — place (or move) the active draft here
    if (!active) return;
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    setDrafts(prev => prev.map(d => d.id === active.id ? { ...d, position: { row, col } } : d));
  };

  const allPlaced = drafts.length > 0 && drafts.every(d => d.position);

  const handleSubmit = async () => {
    if (!allPlaced || !name.trim() || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const placed: MoonboardHold[] = [];
    const placedDraftIds = new Set<string>();
    for (const d of drafts) {
      try {
        const hold = await placeMoonboardHold({
          row: d.position!.row,
          col: d.position!.col,
          guestName: name.trim(),
          message: d.message.trim(),
          shape: d.shape,
          color: d.color,
        });
        placed.push(hold);
        placedDraftIds.add(d.id);
      } catch (err) {
        setHolds(prev => [...prev, ...placed]);
        setDrafts(prev => prev
          .filter(x => !placedDraftIds.has(x.id))
          .map(x => x.id === d.id ? { ...x, position: null } : x)
        );
        setSubmitError(err instanceof Error ? err.message : 'That spot was just taken — please pick another.');
        fetchMoonboardHolds().then(setHolds).catch(() => {});
        setSubmitting(false);
        return;
      }
    }

    setHolds(prev => [...prev, ...placed]);
    setDrafts([]);
    setActiveId(null);
    setName('');
    setSubmitting(false);
  };

  const filledCount = holds.length;
  const remaining   = COLS * ROWS - filledCount;
  const boardW = COLS * CELL + (COLS - 1) * GAP + BOARD_PADDING * 2;

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
        <div className="relative py-20 px-4">
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
                    Climbing Board Fund
                  </h1>
                </motion.div>
              </div>
              <motion.p
                className="text-sm font-light text-foreground/60 tracking-wider"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                A climbing wall we dream about
              </motion.p>
            </div>
          </div>
        </div>

        {/* Content card */}
        <div className="max-w-7xl mx-auto px-4 pb-32">
          <div className="bg-white/85 backdrop-blur-md shadow-2xl shadow-black/5 p-8 md:p-12 rounded-sm">

            {/* Stats */}
            <Reveal delay={0.1}>
              <div className="flex justify-center gap-16 mb-10">
                {[
                  { value: filledCount, label: 'Funded' },
                  { value: remaining,   label: 'Available' },
                  { value: COLS * ROWS, label: 'Total' },
                ].map(({ value, label }) => (
                  <div key={label} className="text-center">
                    <div className={`text-3xl font-light mb-1 ${label === 'Funded' ? 'text-primary' : 'text-foreground/40'}`}>
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
                        const key = `${row},${col}`;
                        const hold = holdMap.get(key);
                        const draft = draftMap.get(key);
                        const isActiveDraft = !!draft && draft.id === active?.id;
                        return (
                          <button
                            key={key}
                            onClick={() => handleCellClick(row, col)}
                            title={
                              hold
                                ? `${hold.guestName}${hold.message ? ` — "${hold.message}"` : ''}`
                                : draft
                                  ? (isActiveDraft ? 'Tap to pick this up' : 'Tap to select this hold')
                                  : active
                                    ? 'Tap to place your hold here'
                                    : 'Fund a hold to get started'
                            }
                            style={{
                              width: CELL,
                              height: CELL,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 4,
                              border: draft
                                ? `1.5px dashed ${isActiveDraft ? 'rgba(255,220,127,0.9)' : 'rgba(255,255,255,0.35)'}`
                                : '1px solid transparent',
                              cursor: 'pointer',
                              background: hold ? 'rgba(255,255,255,0.04)' : 'transparent',
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
                            ) : draft ? (
                              <motion.div
                                initial={{ scale: 0, rotate: -12 }}
                                animate={{ scale: 1, rotate: 0, opacity: isActiveDraft ? 1 : 0.7 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                                className="group-hover:scale-110 transition-transform duration-150"
                              >
                                <HoldSVG shape={draft.shape} color={draft.color} size={30} />
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
                    {drafts.length > 0
                      ? 'Tap an open spot to place your hold · Tap it again to move it'
                      : 'Tap a hold to see who placed it'}
                  </p>
                </div>
              </Reveal>

              {/* Sidebar */}
              <Reveal direction="right" className="w-full lg:flex-1 lg:min-w-0 lg:max-w-sm">
                <div className="space-y-8">

                  {/* How it works */}
                  <div>
                    <div className="text-xs tracking-[0.3em] uppercase text-primary/55 mb-4 font-light">
                      How It Works
                    </div>
                    <ol className="text-sm font-light text-foreground/60 leading-relaxed space-y-1 list-decimal list-inside">
                      <li>Tap "Pay with Venmo" to send ${HOLD_PRICE} per hold</li>
                      <li>Add your hold(s) below</li>
                      <li>Pick a shape, color, and spot on the board</li>
                      <li>Add your name and a message</li>
                      <li>Lock it in when it's just right</li>
                    </ol>
                  </div>

                  <div className="h-px bg-foreground/5" />

                  {/* Fund a hold */}
                  <div>
                    <div className="text-xs tracking-[0.3em] uppercase text-primary/55 mb-4 font-light">
                      {drafts.length > 0 ? 'Fund More' : 'Fund a Hold'}
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center border border-foreground/15 rounded-full overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setQty(q => Math.max(1, q - 1))}
                          className="w-8 h-8 flex items-center justify-center text-foreground/60 hover:bg-foreground/5 transition-colors"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-light">{qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty(q => Math.min(MAX_QTY, q + 1))}
                          className="w-8 h-8 flex items-center justify-center text-foreground/60 hover:bg-foreground/5 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-light text-foreground/60">
                        × ${HOLD_PRICE} = ${qty * HOLD_PRICE}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openVenmo(
                        qty * HOLD_PRICE,
                        `Krakoff Wedding -- Climbing Board Fund: $${qty * HOLD_PRICE}`
                      )}
                      className="w-full py-3 rounded-full bg-primary/90 hover:bg-primary text-white text-xs tracking-[0.2em] uppercase font-light transition-colors"
                    >
                      Pay ${qty * HOLD_PRICE} with Venmo
                    </button>

                    <button
                      type="button"
                      onClick={handleFund}
                      className="w-full mt-2 py-2 text-foreground/40 hover:text-foreground/60 text-[11px] tracking-[0.15em] uppercase font-light transition-colors underline underline-offset-2"
                    >
                      Already paid? Add {qty}
                    </button>
                  </div>

                  {drafts.length > 0 && (
                    <>
                      <div className="h-px bg-foreground/5" />

                      {/* Place your holds */}
                      <div>
                        <div className="text-xs tracking-[0.3em] uppercase text-primary/55 mb-4 font-light">
                          Make It Yours
                        </div>

                        <Input
                          value={name}
                          onChange={e => { setName(e.target.value); if (e.target.value.trim()) setNameError(false); }}
                          placeholder="Your name *"
                          className={`font-light mb-4 ${nameError ? 'border-destructive ring-1 ring-destructive/40' : ''}`}
                        />
                        {nameError && (
                          <p className="text-xs text-destructive font-light -mt-3 mb-4">Please enter your name first.</p>
                        )}

                        {active && (
                          <Input
                            value={active.message}
                            onChange={e => updateActive({ message: e.target.value })}
                            placeholder="Message (optional)"
                            className="font-light mb-4"
                            maxLength={80}
                          />
                        )}

                        {drafts.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {drafts.map(d => (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => setActiveId(d.id)}
                                className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                                  d.id === active?.id ? 'ring-2 ring-offset-2 ring-primary/50' : 'opacity-70 hover:opacity-100'
                                }`}
                                style={{ background: '#1a1a2e' }}
                                title={d.position ? 'Placed' : 'Not placed yet'}
                              >
                                <HoldSVG shape={d.shape} color={d.color} size={26} />
                                {!d.position && (
                                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-accent border border-white" />
                                )}
                                <span
                                  role="button"
                                  onClick={(e) => { e.stopPropagation(); removeDraft(d.id); }}
                                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white text-foreground/50 hover:text-destructive border border-foreground/10 flex items-center justify-center text-[10px] leading-none"
                                  title="Remove this hold"
                                >
                                  ×
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        {active && (
                          <>
                            <div className="grid grid-cols-5 gap-1.5 mb-4">
                              {SHAPES.map(s => (
                                <ShapeButton
                                  key={s.id}
                                  shape={s.id}
                                  selected={active.shape === s.id}
                                  color={active.color}
                                  onSelect={() => updateActive({ shape: s.id })}
                                />
                              ))}
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                              {COLORS.map(c => (
                                <button
                                  key={c.hex}
                                  type="button"
                                  title={c.name}
                                  onClick={() => updateActive({ color: c.hex })}
                                  style={{ backgroundColor: c.hex }}
                                  className={`w-7 h-7 rounded-full transition-all duration-150 ${
                                    active.color === c.hex
                                      ? 'ring-2 ring-offset-2 ring-foreground/40 scale-110'
                                      : 'hover:scale-105'
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}

                        <p className="text-xs font-light text-foreground/40 mt-2">
                          Tap the board to place — or move — this hold.
                        </p>

                        {submitError && (
                          <p className="text-xs text-destructive font-light mt-2">{submitError}</p>
                        )}

                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={!allPlaced || !name.trim() || submitting}
                          className="w-full mt-4 py-3 rounded-full bg-foreground/90 hover:bg-foreground disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs tracking-[0.2em] uppercase font-light transition-colors"
                        >
                          {submitting
                            ? 'Submitting…'
                            : allPlaced
                              ? `Lock In ${drafts.length} Hold${drafts.length > 1 ? 's' : ''}`
                              : 'Place every hold to continue'}
                        </button>
                      </div>
                    </>
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
