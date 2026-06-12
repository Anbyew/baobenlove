import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';
import { Input } from '../components/ui/input';
import { Reveal } from '../components/Reveal';
import { openVenmo } from '../lib/venmo';

// ─── Types ────────────────────────────────────────────────────────────────────

type PlantId = 'grass' | 'bush' | 'sunflower' | 'cherryTree';

interface StageDef {
  label: string;
  price: number;
  colorable: boolean;
}

interface DraftPlant {
  id: string;
  plantType: PlantId;
  stage: number;
  color: string;
  position: { x: number; y: number } | null;
}

interface PlantedItem extends Omit<DraftPlant, 'position'> {
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VB_W = 1000;
const VB_H = 600;
const MAX_QTY = 10;
const PICKUP_RADIUS = 28;
const STORAGE_KEY = 'wedding-garden-plots-v2';

// exclusion zones — can't plant here
const POND = { cx: 800, cy: 470, rx: 150, ry: 78 };
const STATUE = { cx: 130, cy: 130, r: 75 };

const PLANT_CATALOG: Record<PlantId, { label: string; stages: StageDef[] }> = {
  grass: {
    label: 'Grass',
    stages: [
      { label: 'Tuft', price: 5, colorable: false },
    ],
  },
  bush: {
    label: 'Bush',
    stages: [
      { label: 'Sapling', price: 12, colorable: false },
      { label: 'Full Bush', price: 22, colorable: false },
    ],
  },
  sunflower: {
    label: 'Sunflower',
    stages: [
      { label: 'Sprout', price: 10, colorable: false },
      { label: 'Growing', price: 18, colorable: false },
      { label: 'In Bloom', price: 28, colorable: true },
    ],
  },
  cherryTree: {
    label: 'Cherry Tree',
    stages: [
      { label: 'Sapling', price: 15, colorable: false },
      { label: 'Young Tree', price: 25, colorable: false },
      { label: 'Flowering', price: 40, colorable: false },
      { label: 'Harvest', price: 60, colorable: true },
    ],
  },
};

const PLANT_ORDER: PlantId[] = ['grass', 'bush', 'sunflower', 'cherryTree'];

const COLORS = [
  { name: 'Cherry',   hex: '#D9534F' },
  { name: 'Sunshine', hex: '#FFDC7F' },
  { name: 'Peach',    hex: '#F2A488' },
  { name: 'Blush',    hex: '#E3A7B4' },
  { name: 'Lavender', hex: '#C9B6E4' },
  { name: 'Cream',    hex: '#FFF6E0' },
];

const LEAF = '#7BAE6F';
const LEAF_DARK = '#4F7E4C';
const TRUNK = '#9C7148';
const TRUNK_DARK = '#7A5736';

// ─── SVG Plants ───────────────────────────────────────────────────────────────

function PlantSVG({ type, stage, color, size = 32 }: { type: PlantId; stage: number; color: string; size?: number }) {
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 32 36" style={{ display: 'block', overflow: 'visible' }}>
      {type === 'grass' && (
        <g strokeLinecap="round" fill="none">
          <ellipse cx="16" cy="34" rx="9" ry="2" fill="rgba(0,0,0,0.12)" />
          <path d="M10 33 C9 24 10 19 12 33" stroke={LEAF} strokeWidth="2.2" />
          <path d="M16 33 C16 22 19 16 20 33" stroke={LEAF_DARK} strokeWidth="2.2" />
          <path d="M21 33 C21 25 24 21 25 33" stroke={LEAF} strokeWidth="2.2" />
          <path d="M13 33 C13 27 15 24 16 33" stroke={LEAF_DARK} strokeWidth="2" />
        </g>
      )}

      {type === 'bush' && stage === 0 && (
        <g>
          <ellipse cx="16" cy="34" rx="8" ry="2" fill="rgba(0,0,0,0.12)" />
          <rect x="15" y="22" width="2" height="11" fill={TRUNK} />
          <circle cx="16" cy="19" r="6" fill={LEAF} stroke={LEAF_DARK} strokeWidth="1" />
        </g>
      )}
      {type === 'bush' && stage === 1 && (
        <g>
          <ellipse cx="16" cy="35" rx="12" ry="2.5" fill="rgba(0,0,0,0.12)" />
          <rect x="15" y="26" width="2.5" height="8" fill={TRUNK} />
          <circle cx="10" cy="22" r="7" fill={LEAF} />
          <circle cx="22" cy="22" r="7" fill={LEAF} />
          <circle cx="16" cy="17" r="8" fill={LEAF_DARK} stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        </g>
      )}

      {type === 'sunflower' && stage === 0 && (
        <g>
          <ellipse cx="16" cy="34" rx="6" ry="1.6" fill="rgba(0,0,0,0.12)" />
          <line x1="16" y1="33" x2="16" y2="24" stroke={LEAF} strokeWidth="2" strokeLinecap="round" />
          <path d="M16 28 C12 26 11 30 16 30" fill={LEAF} />
          <circle cx="16" cy="22" r="2.5" fill={LEAF_DARK} />
        </g>
      )}
      {type === 'sunflower' && stage === 1 && (
        <g>
          <ellipse cx="16" cy="34" rx="7" ry="1.8" fill="rgba(0,0,0,0.12)" />
          <line x1="16" y1="33" x2="16" y2="14" stroke={LEAF} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M16 24 C11 22 10 27 16 26" fill={LEAF} />
          <path d="M16 19 C21 17 22 22 16 21" fill={LEAF} />
          <circle cx="16" cy="12" r="3" fill={LEAF_DARK} />
        </g>
      )}
      {type === 'sunflower' && stage === 2 && (
        <g>
          <ellipse cx="16" cy="35" rx="7" ry="1.8" fill="rgba(0,0,0,0.12)" />
          <line x1="16" y1="34" x2="16" y2="14" stroke={LEAF} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M16 26 C10 24 9 29 16 28" fill={LEAF} />
          <path d="M16 21 C22 19 23 24 16 23" fill={LEAF} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
            <ellipse key={angle} cx="16" cy="5" rx="3.2" ry="5.5" fill={color}
              stroke="rgba(0,0,0,0.12)" strokeWidth="0.5"
              transform={`rotate(${angle} 16 10)`} />
          ))}
          <circle cx="16" cy="10" r="4.5" fill="#7A5736" />
          <circle cx="16" cy="10" r="4.5" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
        </g>
      )}

      {type === 'cherryTree' && stage === 0 && (
        <g>
          <ellipse cx="16" cy="34" rx="8" ry="2" fill="rgba(0,0,0,0.12)" />
          <rect x="15" y="22" width="2" height="11" fill={TRUNK} />
          <circle cx="16" cy="19" r="6" fill={LEAF} stroke={LEAF_DARK} strokeWidth="1" />
        </g>
      )}
      {type === 'cherryTree' && stage === 1 && (
        <g>
          <ellipse cx="16" cy="35" rx="12" ry="2.5" fill="rgba(0,0,0,0.12)" />
          <rect x="14.5" y="22" width="3" height="12" fill={TRUNK_DARK} />
          <circle cx="10" cy="16" r="7.5" fill={LEAF} />
          <circle cx="22" cy="16" r="7.5" fill={LEAF} />
          <circle cx="16" cy="11" r="8.5" fill={LEAF_DARK} stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        </g>
      )}
      {type === 'cherryTree' && stage === 2 && (
        <g>
          <ellipse cx="16" cy="35" rx="12" ry="2.5" fill="rgba(0,0,0,0.12)" />
          <rect x="14.5" y="22" width="3" height="12" fill={TRUNK_DARK} />
          <circle cx="10" cy="16" r="7.5" fill={LEAF} />
          <circle cx="22" cy="16" r="7.5" fill={LEAF} />
          <circle cx="16" cy="11" r="8.5" fill={LEAF_DARK} stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
          {[[8, 10], [22, 9], [16, 5], [12, 16], [21, 17], [16, 13]].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="1.6" fill="#FBD3E0" stroke="rgba(0,0,0,0.08)" strokeWidth="0.4" />
          ))}
        </g>
      )}
      {type === 'cherryTree' && stage === 3 && (
        <g>
          <ellipse cx="16" cy="35" rx="12" ry="2.5" fill="rgba(0,0,0,0.12)" />
          <rect x="14.5" y="22" width="3" height="12" fill={TRUNK_DARK} />
          <circle cx="10" cy="16" r="7.5" fill={LEAF} />
          <circle cx="22" cy="16" r="7.5" fill={LEAF} />
          <circle cx="16" cy="11" r="8.5" fill={LEAF_DARK} stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
          {[[8, 10], [22, 9], [16, 5], [12, 16], [21, 17], [16, 13], [10, 19], [20, 13]].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="2" fill={color} stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
          ))}
        </g>
      )}
    </svg>
  );
}

// ─── Scene Background ────────────────────────────────────────────────────────

function GardenScene() {
  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id="grass-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A9D08A" />
          <stop offset="100%" stopColor="#8FBE73" />
        </linearGradient>
        <linearGradient id="pond-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9FD3E0" />
          <stop offset="100%" stopColor="#6FB3C9" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#grass-grad)" />

      {/* texture patches */}
      <ellipse cx="250" cy="380" rx="160" ry="70" fill="rgba(255,255,255,0.06)" />
      <ellipse cx="600" cy="180" rx="200" ry="90" fill="rgba(0,0,0,0.04)" />
      <ellipse cx="450" cy="520" rx="220" ry="80" fill="rgba(255,255,255,0.05)" />

      {/* winding path */}
      <path
        d="M -20 560 C 150 540, 220 480, 320 470 C 430 458, 470 400, 430 330 C 400 280, 470 240, 560 250"
        fill="none"
        stroke="#E3D2B4"
        strokeWidth="46"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M -20 560 C 150 540, 220 480, 320 470 C 430 458, 470 400, 430 330 C 400 280, 470 240, 560 250"
        fill="none"
        stroke="#D4BE96"
        strokeWidth="46"
        strokeDasharray="2 26"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* pond */}
      <ellipse cx={POND.cx} cy={POND.cy} rx={POND.rx} ry={POND.ry} fill="url(#pond-grad)" stroke="#5C95A8" strokeWidth="3" />
      <ellipse cx={POND.cx - 40} cy={POND.cy + 10} rx="22" ry="9" fill="#7FBE83" opacity="0.9" />
      <ellipse cx={POND.cx + 50} cy={POND.cy - 15} rx="16" ry="7" fill="#7FBE83" opacity="0.85" />
      <path d={`M ${POND.cx - 60} ${POND.cy} q 20 -8 40 0`} stroke="rgba(255,255,255,0.5)" strokeWidth="2" fill="none" />
      <path d={`M ${POND.cx - 20} ${POND.cy + 25} q 25 -6 50 0`} stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" />

      {/* statue / birdbath */}
      <g>
        <ellipse cx={STATUE.cx} cy={STATUE.cy + 38} rx="34" ry="8" fill="rgba(0,0,0,0.1)" />
        <rect x={STATUE.cx - 6} y={STATUE.cy + 5} width="12" height="30" fill="#C9C4BC" />
        <ellipse cx={STATUE.cx} cy={STATUE.cy + 4} rx="26" ry="9" fill="#D9D5CD" stroke="#B7B2A9" strokeWidth="1.5" />
        <ellipse cx={STATUE.cx} cy={STATUE.cy - 8} rx="16" ry="6" fill="#CFCAC1" />
        <path d={`M ${STATUE.cx} ${STATUE.cy - 8} q -10 -22 10 -28`} stroke="#B7B2A9" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let nextDraftId = 1;
function makeDraft(plantType: PlantId, stage: number, color: string): DraftPlant {
  return { id: `garden-draft-${nextDraftId++}`, plantType, stage, color, position: null };
}

function loadGarden(): PlantedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as PlantedItem[] : [];
  } catch {
    return [];
  }
}

function saveGarden(items: PlantedItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function inPond(x: number, y: number) {
  const dx = (x - POND.cx) / POND.rx;
  const dy = (y - POND.cy) / POND.ry;
  return dx * dx + dy * dy < 1;
}

function inStatue(x: number, y: number) {
  const dx = x - STATUE.cx;
  const dy = y - STATUE.cy;
  return Math.sqrt(dx * dx + dy * dy) < STATUE.r;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function Garden() {
  const [items, setItems] = useState<PlantedItem[]>(loadGarden);
  const [drafts, setDrafts] = useState<DraftPlant[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [poofs, setPoofs] = useState<{ id: string; x: number; y: number }[]>([]);

  const [plantType, setPlantType] = useState<PlantId>('sunflower');
  const [stage, setStage] = useState(0);
  const [color, setColor] = useState(COLORS[0].hex);
  const [qty, setQty] = useState(1);

  const [gardenerName, setGardenerName] = useState('');
  const [downloading, setDownloading] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);

  const unplacedDrafts = drafts.filter(d => !d.position);
  const active = drafts.find(d => d.id === activeId && !d.position) ?? unplacedDrafts[0] ?? null;

  const stages = PLANT_CATALOG[plantType].stages;
  const stageDef = stages[stage] ?? stages[0];
  const unitPrice = stageDef.price;

  const handlePay = () => {
    openVenmo(qty * unitPrice, `Krakoff Wedding -- Garden Fund: $${qty * unitPrice}`);
  };

  const handleAddDrafts = () => {
    const fresh = Array.from({ length: qty }, () => makeDraft(plantType, stage, color));
    setDrafts(prev => [...prev, ...fresh]);
    setActiveId(fresh[0].id);
    setQty(1);
  };

  const removeDraft = (id: string) => {
    setDrafts(prev => {
      const next = prev.filter(d => d.id !== id);
      if (activeId === id) setActiveId(next.find(d => !d.position)?.id ?? null);
      return next;
    });
  };

  const handleSceneClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = sceneRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * VB_W;
    const y = ((e.clientY - rect.top) / rect.height) * VB_H;

    // pick up an already-placed (but not yet committed) draft if clicked near it
    const placedDraft = drafts.find(d => d.position && Math.hypot(d.position.x - x, d.position.y - y) < PICKUP_RADIUS);
    if (placedDraft) {
      setDrafts(prev => prev.map(d => d.id === placedDraft.id ? { ...d, position: null } : d));
      setActiveId(placedDraft.id);
      return;
    }

    if (!active) return;
    if (inPond(x, y) || inStatue(x, y)) return;

    setDrafts(prev => prev.map(d => d.id === active.id ? { ...d, position: { x, y } } : d));
    const remaining = drafts.filter(d => !d.position && d.id !== active.id);
    setActiveId(remaining[0]?.id ?? null);
  };

  const allPlaced = drafts.length > 0 && drafts.every(d => d.position);

  const handlePlant = () => {
    if (!allPlaced) return;
    const newItems: PlantedItem[] = drafts.map(d => ({
      id: d.id,
      plantType: d.plantType,
      stage: d.stage,
      color: d.color,
      x: d.position!.x,
      y: d.position!.y,
      rotation: Math.random() * 16 - 8,
      scale: 0.9 + Math.random() * 0.3,
    }));
    const merged = [...items, ...newItems];
    setItems(merged);
    saveGarden(merged);

    setPoofs(prev => [...prev, ...newItems.map(it => ({ id: it.id, x: it.x, y: it.y }))]);
    newItems.forEach(it => {
      setTimeout(() => setPoofs(prev => prev.filter(p => p.id !== it.id)), 700);
    });

    setDrafts([]);
    setActiveId(null);
  };

  const handleReset = () => {
    if (!confirm('Clear your whole garden? This cannot be undone.')) return;
    setItems([]);
    setDrafts([]);
    setActiveId(null);
    saveGarden([]);
  };

  const handleDownload = async () => {
    if (!sceneRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(sceneRef.current, { pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${gardenerName.trim() || 'my'}-garden.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      // ignore — best-effort export
    } finally {
      setDownloading(false);
    }
  };

  const gardenValue = items.reduce((sum, it) => sum + PLANT_CATALOG[it.plantType].stages[it.stage].price, 0);

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
                    Grow Our Garden
                  </h1>
                </motion.div>
              </div>
              <motion.p
                className="text-sm font-light text-foreground/60 tracking-wider"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Plant something for our first home — yours to grow
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
                  { value: items.length, label: 'Planted' },
                  { value: `$${gardenValue}`, label: 'Garden Value' },
                ].map(({ value, label }) => (
                  <div key={label} className="text-center">
                    <div className={`text-3xl font-light mb-1 ${label === 'Planted' ? 'text-primary' : 'text-foreground/40'}`}>
                      {value}
                    </div>
                    <div className="text-xs tracking-wider uppercase text-foreground/50">{label}</div>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* Scene + Sidebar */}
            <div className="flex flex-col lg:flex-row gap-12 items-start justify-center">

              {/* The Garden Scene */}
              <Reveal direction="left" className="w-full lg:flex-1 lg:min-w-0">
                <div className="w-full">
                  <div
                    ref={sceneRef}
                    onClick={handleSceneClick}
                    className="relative w-full rounded-md overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
                    style={{ aspectRatio: `${VB_W} / ${VB_H}`, cursor: active ? 'crosshair' : 'default' }}
                  >
                    <GardenScene />

                    {gardenerName.trim() && (
                      <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-light tracking-[0.15em] uppercase text-foreground/70 shadow-sm">
                        {gardenerName.trim()}'s Garden
                      </div>
                    )}

                    {/* Planted items */}
                    {items.map(it => (
                      <div
                        key={it.id}
                        className="absolute"
                        style={{
                          left: `${(it.x / VB_W) * 100}%`,
                          top: `${(it.y / VB_H) * 100}%`,
                          transform: `translate(-50%, -92%) rotate(${it.rotation}deg) scale(${it.scale})`,
                        }}
                        title={`${PLANT_CATALOG[it.plantType].label} — ${PLANT_CATALOG[it.plantType].stages[it.stage].label}`}
                      >
                        <PlantSVG type={it.plantType} stage={it.stage} color={it.color} size={42} />
                      </div>
                    ))}

                    {/* Pending drafts */}
                    {drafts.filter(d => d.position).map(d => (
                      <motion.div
                        key={d.id}
                        className="absolute"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: d.id === active?.id ? 1 : 0.75 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 16 }}
                        style={{
                          left: `${(d.position!.x / VB_W) * 100}%`,
                          top: `${(d.position!.y / VB_H) * 100}%`,
                          transform: 'translate(-50%, -92%)',
                        }}
                        title="Tap to pick this up"
                      >
                        <div className="rounded-full border-2 border-dashed border-white/70 p-1">
                          <PlantSVG type={d.plantType} stage={d.stage} color={d.color} size={42} />
                        </div>
                      </motion.div>
                    ))}

                    {/* Planting "poof" */}
                    <AnimatePresence>
                      {poofs.map(p => (
                        <motion.div
                          key={p.id}
                          className="absolute rounded-full pointer-events-none"
                          style={{
                            left: `${(p.x / VB_W) * 100}%`,
                            top: `${(p.y / VB_H) * 100}%`,
                            width: 60, height: 60,
                            marginLeft: -30, marginTop: -45,
                            background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)',
                          }}
                          initial={{ scale: 0.2, opacity: 0.9 }}
                          animate={{ scale: 1.8, opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.7, ease: 'easeOut' }}
                        />
                      ))}
                    </AnimatePresence>
                  </div>

                  <p className="text-xs text-center text-foreground/30 mt-3 font-light">
                    {active
                      ? 'Tap anywhere on the grass to plant — avoid the pond and statue'
                      : 'Your garden, just for you — grow it as much as you like'}
                  </p>
                </div>
              </Reveal>

              {/* Sidebar */}
              <Reveal direction="right" className="w-full lg:w-[22rem] lg:flex-shrink-0">
                <div className="space-y-8">

                  {/* How it works */}
                  <div>
                    <div className="text-xs tracking-[0.3em] uppercase text-primary/55 mb-4 font-light">
                      How It Works
                    </div>
                    <ol className="text-sm font-light text-foreground/60 leading-relaxed space-y-1 list-decimal list-inside">
                      <li>Pick a plant and how grown you want it</li>
                      <li>Tap "Pay with Venmo" for that amount</li>
                      <li>Add it, then tap a spot in the garden</li>
                      <li>Keep going — grow your whole garden!</li>
                      <li>Download it to keep as a memory</li>
                    </ol>
                  </div>

                  <div className="h-px bg-foreground/5" />

                  {/* Choose a plant */}
                  <div>
                    <div className="text-xs tracking-[0.3em] uppercase text-primary/55 mb-4 font-light">
                      Choose a Plant
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 mb-4">
                      {PLANT_ORDER.map(id => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => { setPlantType(id); setStage(0); }}
                          className={`p-2 rounded flex flex-col items-center gap-1 border transition-all ${
                            plantType === id
                              ? 'border-primary/40 bg-primary/5'
                              : 'border-foreground/10 hover:border-foreground/20'
                          }`}
                        >
                          <PlantSVG
                            type={id}
                            stage={PLANT_CATALOG[id].stages.length - 1}
                            color={plantType === id ? color : '#9ca3af'}
                            size={28}
                          />
                          <span className="text-[10px] font-light text-foreground/60">{PLANT_CATALOG[id].label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Growth stage / price */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {stages.map((s, i) => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => setStage(i)}
                          className={`px-3 py-2 rounded-full border text-xs font-light transition-all ${
                            stage === i
                              ? 'border-primary/50 bg-primary/10 text-foreground'
                              : 'border-foreground/15 text-foreground/60 hover:border-foreground/30'
                          }`}
                        >
                          {s.label} · ${s.price}
                        </button>
                      ))}
                    </div>

                    {/* Color picker */}
                    {stageDef.colorable && (
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
                    )}

                    {/* Quantity */}
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
                        × ${unitPrice} = ${qty * unitPrice}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handlePay}
                      className="w-full py-3 rounded-full bg-primary/90 hover:bg-primary text-white text-xs tracking-[0.2em] uppercase font-light transition-colors"
                    >
                      Pay ${qty * unitPrice} with Venmo
                    </button>

                    <button
                      type="button"
                      onClick={handleAddDrafts}
                      className="w-full mt-2 py-2 text-foreground/40 hover:text-foreground/60 text-[11px] tracking-[0.15em] uppercase font-light transition-colors underline underline-offset-2"
                    >
                      Already paid? Add {qty}
                    </button>
                  </div>

                  {drafts.length > 0 && (
                    <>
                      <div className="h-px bg-foreground/5" />

                      <div>
                        <div className="text-xs tracking-[0.3em] uppercase text-primary/55 mb-4 font-light">
                          Plant Them
                        </div>

                        {drafts.length > 1 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {drafts.map(d => (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => !d.position && setActiveId(d.id)}
                                className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                                  d.id === active?.id ? 'ring-2 ring-offset-2 ring-primary/50' : 'opacity-70 hover:opacity-100'
                                }`}
                                style={{ background: '#E8DCC4' }}
                                title={d.position ? 'Placed' : 'Not placed yet'}
                              >
                                <PlantSVG type={d.plantType} stage={d.stage} color={d.color} size={28} />
                                {!d.position && (
                                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-accent border border-white" />
                                )}
                                <span
                                  role="button"
                                  onClick={(e) => { e.stopPropagation(); removeDraft(d.id); }}
                                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white text-foreground/50 hover:text-destructive border border-foreground/10 flex items-center justify-center text-[10px] leading-none"
                                  title="Remove"
                                >
                                  ×
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        <p className="text-xs font-light text-foreground/40 mb-4">
                          Tap a spot in the garden to plant — or tap a planted item to move it.
                        </p>

                        <button
                          type="button"
                          onClick={handlePlant}
                          disabled={!allPlaced}
                          className="w-full py-3 rounded-full bg-foreground/90 hover:bg-foreground disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs tracking-[0.2em] uppercase font-light transition-colors"
                        >
                          {allPlaced
                            ? `Plant ${drafts.length} Item${drafts.length > 1 ? 's' : ''}`
                            : 'Place every plant to continue'}
                        </button>
                      </div>
                    </>
                  )}

                  <div className="h-px bg-foreground/5" />

                  {/* Keep / download */}
                  <div>
                    <div className="text-xs tracking-[0.3em] uppercase text-primary/55 mb-4 font-light">
                      Keep Your Garden
                    </div>
                    <Input
                      value={gardenerName}
                      onChange={e => setGardenerName(e.target.value)}
                      placeholder="Label your garden (optional)"
                      className="font-light mb-3"
                      maxLength={40}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleDownload}
                        disabled={downloading || items.length === 0}
                        className="flex-1 py-3 rounded-full border border-foreground/15 hover:border-foreground/30 disabled:opacity-30 disabled:cursor-not-allowed text-foreground/70 text-xs tracking-[0.2em] uppercase font-light transition-colors"
                      >
                        {downloading ? 'Saving…' : 'Download'}
                      </button>
                      <button
                        type="button"
                        onClick={handleReset}
                        disabled={items.length === 0}
                        className="py-3 px-4 rounded-full border border-foreground/10 hover:border-destructive/40 hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed text-foreground/40 text-xs tracking-[0.2em] uppercase font-light transition-colors"
                      >
                        Reset
                      </button>
                    </div>
                    <p className="text-xs font-light text-foreground/35 mt-3 leading-relaxed">
                      This garden is just yours — it lives in this browser. Download a picture any time to keep, or share with us for our thank-you card!
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
