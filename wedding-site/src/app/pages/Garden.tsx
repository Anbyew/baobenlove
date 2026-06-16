import { useState, useRef, useId, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';
import { Input } from '../components/ui/input';
import { Reveal } from '../components/Reveal';
import { openVenmo } from '../lib/venmo';
import { trackClick, getGarden, saveGarden as saveGardenToServer } from '../lib/auth';
import { useGuestIdentity } from '../context/GuestIdentityContext';

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
const QTY_OPTIONS = [1, 2, 4, 8, 16, 32, 64];
const PICKUP_RADIUS = 28;
const STORAGE_KEY = 'wedding-garden-plots-v2';

// exclusion zones — can't plant here
const POND = { cx: 800, cy: 470, rx: 150, ry: 78 };
const STATUE = { cx: 130, cy: 130, r: 75 };

const PLANT_CATALOG: Record<PlantId, { label: string; svgStage: number; stage: StageDef }> = {
  grass: {
    label: 'Grass',
    svgStage: 0,
    stage: { label: 'Tuft', price: 2, colorable: false },
  },
  bush: {
    label: 'Bush',
    svgStage: 1,
    stage: { label: 'Full Bush', price: 8, colorable: false },
  },
  sunflower: {
    label: 'Sunflower',
    svgStage: 2,
    stage: { label: 'In Bloom', price: 16, colorable: true },
  },
  cherryTree: {
    label: 'Cherry Tree',
    svgStage: 3,
    stage: { label: 'Harvest', price: 32, colorable: true },
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

const LEAF = '#7FBF6A';
const LEAF_DARK = '#4F7E4C';
const LEAF_LIGHT = '#B6E29A';
const TRUNK = '#B98655';
const TRUNK_DARK = '#8C6239';
const SHADOW = 'rgba(40,30,10,0.14)';
const BLOSSOM = '#FBD3E0';
const BLOSSOM_LIGHT = '#FFFFFF';
const SEED_LIGHT = '#A9744F';
const SEED_DARK = '#6B4A2A';
const FLOWER_CENTER = '#FFDC7F';

// Lighten a hex color towards white by `amt` (0-1)
function lighten(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 0xff) + (255 - ((n >> 16) & 0xff)) * amt);
  const g = Math.round(((n >> 8) & 0xff) + (255 - ((n >> 8) & 0xff)) * amt);
  const b = Math.round((n & 0xff) + (255 - (n & 0xff)) * amt);
  return `#${[r, g, b].map(v => Math.min(255, v).toString(16).padStart(2, '0')).join('')}`;
}

// ─── SVG Plants ───────────────────────────────────────────────────────────────

// A gently-curved, pointed leaf/blade shape from (cx,baseY) up to (tipX,tipY)
function leafPath(cx: number, baseY: number, tipX: number, tipY: number, width: number) {
  const mx = (cx + tipX) / 2;
  const my = (baseY + tipY) / 2;
  return `M ${cx - width} ${baseY} Q ${mx - width * 1.3} ${my} ${tipX} ${tipY} Q ${mx + width * 1.3} ${my} ${cx + width} ${baseY} Z`;
}

function PlantSVG({ type, stage, color, size = 32 }: { type: PlantId; stage: number; color: string; size?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const leafGrad = `leafGrad-${uid}`;
  const leafGradDark = `leafGradDark-${uid}`;
  const trunkGrad = `trunkGrad-${uid}`;
  const bladeGrad = `bladeGrad-${uid}`;
  const petalGrad = `petalGrad-${uid}`;
  const seedGrad = `seedGrad-${uid}`;
  const blossomGrad = `blossomGrad-${uid}`;

  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 32 36" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <radialGradient id={leafGrad} cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor={LEAF_LIGHT} />
          <stop offset="55%" stopColor={LEAF} />
          <stop offset="100%" stopColor={LEAF_DARK} />
        </radialGradient>
        <radialGradient id={leafGradDark} cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor={LEAF} />
          <stop offset="100%" stopColor={LEAF_DARK} />
        </radialGradient>
        <linearGradient id={trunkGrad} x1="0" y1="0" x2="1" y2="0.2">
          <stop offset="0%" stopColor={TRUNK} />
          <stop offset="100%" stopColor={TRUNK_DARK} />
        </linearGradient>
        <linearGradient id={bladeGrad} x1="0" y1="1" x2="0.3" y2="0">
          <stop offset="0%" stopColor={LEAF_DARK} />
          <stop offset="100%" stopColor={LEAF_LIGHT} />
        </linearGradient>
        <radialGradient id={petalGrad} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={lighten(color, 0.55)} />
          <stop offset="100%" stopColor={color} />
        </radialGradient>
        <radialGradient id={seedGrad} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={SEED_LIGHT} />
          <stop offset="100%" stopColor={SEED_DARK} />
        </radialGradient>
        <radialGradient id={blossomGrad} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={BLOSSOM_LIGHT} />
          <stop offset="100%" stopColor={BLOSSOM} />
        </radialGradient>
      </defs>

      {type === 'grass' && (
        <g>
          <ellipse cx="16" cy="34" rx="10" ry="2.2" fill={SHADOW} />
          <path d={leafPath(11, 33, 9.5, 17, 1.7)} fill={`url(#${bladeGrad})`} />
          <path d={leafPath(20, 33, 22.5, 16.5, 1.7)} fill={`url(#${bladeGrad})`} />
          <path d={leafPath(15, 33, 17, 12.5, 1.9)} fill={LEAF_DARK} />
          <path d={leafPath(13, 33, 14, 21.5, 1.5)} fill={`url(#${bladeGrad})`} />
          <path d={leafPath(18.5, 33, 19.5, 23, 1.4)} fill={LEAF} />
          <g transform="translate(22 26)">
            {[0, 72, 144, 216, 288].map(a => (
              <ellipse key={a} cx="0" cy="-1.4" rx="1" ry="1.6" fill={`url(#${blossomGrad})`} transform={`rotate(${a})`} />
            ))}
            <circle cx="0" cy="0" r="1" fill={FLOWER_CENTER} />
          </g>
        </g>
      )}

      {type === 'bush' && stage === 0 && (
        <g>
          <ellipse cx="16" cy="34" rx="8" ry="2" fill={SHADOW} />
          <rect x="15" y="23" width="2" height="10" rx="1" fill={`url(#${trunkGrad})`} />
          <circle cx="17" cy="21.5" r="6.8" fill={`url(#${leafGradDark})`} opacity="0.5" />
          <circle cx="16" cy="20" r="6.5" fill={`url(#${leafGrad})`} />
          <circle cx="13.2" cy="17" r="2.4" fill={LEAF_LIGHT} opacity="0.55" />
          {[[12.5, 22], [19, 18.5]].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="1.1" fill={`url(#${blossomGrad})`} stroke="rgba(0,0,0,0.06)" strokeWidth="0.3" />
          ))}
        </g>
      )}
      {type === 'bush' && stage === 1 && (
        <g>
          <ellipse cx="16" cy="35" rx="12" ry="2.5" fill={SHADOW} />
          <rect x="15" y="27" width="2.5" height="8" rx="1" fill={`url(#${trunkGrad})`} />
          <circle cx="10.5" cy="22.5" r="7.2" fill={`url(#${leafGradDark})`} opacity="0.6" />
          <circle cx="10" cy="22" r="7" fill={`url(#${leafGrad})`} />
          <circle cx="22.5" cy="22.5" r="7.2" fill={`url(#${leafGradDark})`} opacity="0.6" />
          <circle cx="22" cy="22" r="7" fill={`url(#${leafGrad})`} />
          <circle cx="16.5" cy="16.5" r="8.2" fill={`url(#${leafGradDark})`} />
          <circle cx="16" cy="16" r="8" fill={`url(#${leafGrad})`} />
          <circle cx="12.5" cy="13" r="3" fill={LEAF_LIGHT} opacity="0.5" />
          {[[9, 21], [22.5, 19], [16, 11], [12, 25], [19, 24]].map(([cx, cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="1.4" fill={`url(#${blossomGrad})`} stroke="rgba(0,0,0,0.08)" strokeWidth="0.3" />
              <circle cx={cx - 0.4} cy={cy - 0.4} r="0.5" fill="#FFFFFF" opacity="0.8" />
            </g>
          ))}
        </g>
      )}

      {type === 'sunflower' && stage === 0 && (
        <g>
          <ellipse cx="16" cy="34" rx="6" ry="1.6" fill={SHADOW} />
          <path d={leafPath(16, 33, 16, 25.5, 1.4)} fill={`url(#${bladeGrad})`} />
          <path d={leafPath(16, 29, 11.5, 25, 3)} fill={`url(#${leafGrad})`} />
          <path d={leafPath(16, 28, 20.5, 24, 3)} fill={`url(#${leafGradDark})`} />
          <circle cx="16" cy="24" r="2.2" fill={`url(#${leafGrad})`} />
          <circle cx="15.2" cy="23.2" r="0.8" fill={LEAF_LIGHT} opacity="0.7" />
        </g>
      )}
      {type === 'sunflower' && stage === 1 && (
        <g>
          <ellipse cx="16" cy="34" rx="7" ry="1.8" fill={SHADOW} />
          <path d={leafPath(16, 33, 16, 14.5, 1.6)} fill={`url(#${bladeGrad})`} />
          <path d={leafPath(16, 26, 9, 21, 3.4)} fill={`url(#${leafGrad})`} />
          <path d={leafPath(16, 21, 23, 17, 3.4)} fill={`url(#${leafGradDark})`} />
          <ellipse cx="16" cy="13" rx="3.3" ry="4.2" fill={`url(#${leafGradDark})`} />
          <ellipse cx="15" cy="11.5" rx="1.4" ry="1.8" fill={LEAF_LIGHT} opacity="0.5" />
          <ellipse cx="16" cy="13" rx="3.3" ry="4.2" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="0.4" />
        </g>
      )}
      {type === 'sunflower' && stage === 2 && (
        <g>
          <ellipse cx="16" cy="35" rx="7.5" ry="1.8" fill={SHADOW} />
          <path d={leafPath(16, 34, 16, 16, 1.8)} fill={`url(#${bladeGrad})`} />
          <path d={leafPath(16, 27, 8.5, 22, 3.4)} fill={`url(#${leafGrad})`} />
          <path d={leafPath(16, 22, 23.5, 18, 3.4)} fill={`url(#${leafGradDark})`} />
          {/* back ring of petals */}
          {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map(angle => (
            <ellipse key={`b${angle}`} cx="16" cy="6" rx="2.6" ry="5" fill={color} opacity="0.55"
              transform={`rotate(${angle} 16 11)`} />
          ))}
          {/* front ring of petals */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
            <ellipse key={`f${angle}`} cx="16" cy="5" rx="3.2" ry="5.5" fill={`url(#${petalGrad})`}
              stroke="rgba(0,0,0,0.1)" strokeWidth="0.4"
              transform={`rotate(${angle} 16 11)`} />
          ))}
          {/* seed head */}
          <circle cx="16" cy="11" r="4.6" fill={`url(#${seedGrad})`} />
          <circle cx="16" cy="11" r="4.6" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
          {[[14.5, 9.5], [17.8, 10], [15.5, 12.5], [18, 13], [13.5, 12], [16.5, 9], [14, 11.5]].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="0.55" fill={SEED_DARK} opacity="0.8" />
          ))}
          <ellipse cx="14.5" cy="9.5" rx="1.6" ry="1" fill="#FFFFFF" opacity="0.18" />
        </g>
      )}

      {type === 'cherryTree' && stage === 0 && (
        <g>
          <ellipse cx="16" cy="34" rx="8" ry="2" fill={SHADOW} />
          <rect x="15" y="22" width="2" height="11" rx="1" fill={`url(#${trunkGrad})`} />
          <circle cx="16.8" cy="19.8" r="6.2" fill={`url(#${leafGradDark})`} />
          <circle cx="16" cy="19" r="6" fill={`url(#${leafGrad})`} />
          <circle cx="13.5" cy="16.5" r="2.6" fill={LEAF_LIGHT} opacity="0.5" />
        </g>
      )}
      {type === 'cherryTree' && (stage === 1 || stage === 2 || stage === 3) && (
        <g>
          <ellipse cx="16" cy="35" rx="12" ry="2.5" fill={SHADOW} />
          <path d="M16 34 L16 22 M16 26 L12 22 M16 25 L20 21" stroke={`url(#${trunkGrad})`} strokeWidth="2" strokeLinecap="round" fill="none" />
          <circle cx="10.4" cy="16.4" r="7.7" fill={`url(#${leafGradDark})`} />
          <circle cx="10" cy="16" r="7.5" fill={`url(#${leafGrad})`} />
          <circle cx="22.4" cy="16.4" r="7.7" fill={`url(#${leafGradDark})`} />
          <circle cx="22" cy="16" r="7.5" fill={`url(#${leafGrad})`} />
          <circle cx="16.5" cy="11.5" r="8.7" fill={`url(#${leafGradDark})`} />
          <circle cx="16" cy="11" r="8.5" fill={`url(#${leafGrad})`} />
          <circle cx="12" cy="8" r="3.4" fill={LEAF_LIGHT} opacity="0.45" />

          {stage === 2 && [[8, 10], [22, 9], [16, 5], [12, 16], [21, 17], [16, 13], [9.5, 19], [20.5, 13.5], [13, 9.5], [19, 6.5]].map(([cx, cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="1.7" fill={`url(#${blossomGrad})`} stroke="rgba(0,0,0,0.06)" strokeWidth="0.3" />
              <circle cx={cx - 0.5} cy={cy - 0.5} r="0.6" fill="#FFFFFF" opacity="0.85" />
            </g>
          ))}

          {stage === 3 && [[8, 11], [22, 10], [16, 5.5], [12, 17], [21, 18], [16, 14], [10, 20], [20, 14.5], [13.5, 9], [19, 7]].map(([cx, cy], i) => (
            <g key={i}>
              <line x1={cx} y1={cy - 2.2} x2={cx} y2={cy - 0.8} stroke={TRUNK_DARK} strokeWidth="0.5" />
              <circle cx={cx} cy={cy} r="2.1" fill={`url(#${petalGrad})`} stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
              <circle cx={cx - 0.6} cy={cy - 0.6} r="0.7" fill="#FFFFFF" opacity="0.55" />
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

// ─── Scene Background ────────────────────────────────────────────────────────

const FLOWER_SPOTS: [number, number, number][] = [
  [60, 70, 0], [150, 120, 1], [880, 70, 2], [950, 170, 0],
  [780, 490, 1], [110, 480, 2], [55, 300, 0], [930, 380, 1],
];
const FLOWER_COLORS = ['#FFDC7F', '#FBD3E0', '#FFFFFF'];
const STEPPING_STONES: [number, number][] = [
  [120, 525], [260, 478], [400, 452], [470, 365], [500, 280],
];
const LILY_PADS: [number, number, number][] = [
  [-46, 12, 15], [54, -16, 11], [10, 28, 9],
];

function GardenScene() {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const grassGrad = `grassGrad-${uid}`;
  const pondGrad = `pondGrad-${uid}`;
  const lilyGrad = `lilyGrad-${uid}`;
  const stoneGrad = `stoneGrad-${uid}`;
  const sunGlow = `sunGlow-${uid}`;

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id={grassGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B7DD9C" />
          <stop offset="55%" stopColor="#9ACB7E" />
          <stop offset="100%" stopColor="#82B968" />
        </linearGradient>
        <linearGradient id={pondGrad} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#BFE8F0" />
          <stop offset="55%" stopColor="#8FCBDA" />
          <stop offset="100%" stopColor="#5C9FB6" />
        </linearGradient>
        <radialGradient id={lilyGrad} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#9FD89A" />
          <stop offset="100%" stopColor="#5FA463" />
        </radialGradient>
        <radialGradient id={stoneGrad} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#F2EADC" />
          <stop offset="100%" stopColor="#C9BFAE" />
        </radialGradient>
        <radialGradient id={sunGlow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF6D8" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFF6D8" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width={VB_W} height={VB_H} fill={`url(#${grassGrad})`} />
      <circle cx={VB_W * 0.82} cy={VB_H * 0.12} r={VB_W * 0.32} fill={`url(#${sunGlow})`} />

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
      {/* stepping stones */}
      {STEPPING_STONES.map(([cx, cy], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx="20" ry="9" fill={`url(#${stoneGrad})`} stroke="#B7AC98" strokeWidth="1.5" opacity="0.9" />
      ))}

      {/* pond */}
      <ellipse cx={POND.cx} cy={POND.cy} rx={POND.rx} ry={POND.ry} fill={`url(#${pondGrad})`} stroke="#5C95A8" strokeWidth="3" />
      <ellipse cx={POND.cx + 6} cy={POND.cy + POND.ry * 0.5} rx={POND.rx * 0.7} ry={POND.ry * 0.35} fill="rgba(255,255,255,0.18)" />
      <path d={`M ${POND.cx - 60} ${POND.cy} q 20 -8 40 0`} stroke="rgba(255,255,255,0.5)" strokeWidth="2" fill="none" />
      <path d={`M ${POND.cx - 20} ${POND.cy + 25} q 25 -6 50 0`} stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" />
      <path d={`M ${POND.cx + 30} ${POND.cy - 18} q 22 -6 44 0`} stroke="rgba(255,255,255,0.35)" strokeWidth="2" fill="none" />
      {/* lily pads */}
      {LILY_PADS.map(([dx, dy, r], i) => (
        <g key={i}>
          <ellipse cx={POND.cx + dx} cy={POND.cy + dy} rx={r} ry={r * 0.65} fill={`url(#${lilyGrad})`} stroke="#4F8C56" strokeWidth="0.8" />
          <path d={`M ${POND.cx + dx} ${POND.cy + dy} l ${r * 0.8} 0`} stroke="#4F8C56" strokeWidth="0.8" />
        </g>
      ))}

      {/* statue / fountain */}
      <g>
        <ellipse cx={STATUE.cx} cy={STATUE.cy + 38} rx="34" ry="8" fill="rgba(0,0,0,0.1)" />
        <ellipse cx={STATUE.cx} cy={STATUE.cy + 4} rx="26" ry="9" fill={`url(#${stoneGrad})`} stroke="#B7B2A9" strokeWidth="1.5" />
        <rect x={STATUE.cx - 6} y={STATUE.cy + 5} width="12" height="30" fill="#D4CFC5" />
        <rect x={STATUE.cx - 6} y={STATUE.cy + 5} width="6" height="30" fill="#C9C4BC" opacity="0.6" />
        <ellipse cx={STATUE.cx} cy={STATUE.cy - 8} rx="16" ry="6" fill="#E1DCD2" />
        <ellipse cx={STATUE.cx - 4} cy={STATUE.cy - 9} rx="8" ry="3" fill="#FFFFFF" opacity="0.4" />
        <path d={`M ${STATUE.cx} ${STATUE.cy - 8} q -10 -22 10 -28`} stroke="#B7B2A9" strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse cx={STATUE.cx + 9} cy={STATUE.cy - 36} rx="5" ry="4" fill="rgba(159,216,240,0.5)" />
      </g>

      {/* decorative flower borders */}
      {FLOWER_SPOTS.map(([x, y, ci], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          {[0, 72, 144, 216, 288].map(a => (
            <ellipse key={a} cx="0" cy="-4" rx="3" ry="5" fill={FLOWER_COLORS[ci]} opacity="0.9" transform={`rotate(${a})`} />
          ))}
          <circle cx="0" cy="0" r="3" fill="#FFDC7F" />
          <path d="M0 6 L0 18" stroke="#6F9E5C" strokeWidth="2" strokeLinecap="round" />
          <path d="M0 12 q -6 -2 -8 4" stroke="#6F9E5C" strokeWidth="1.5" fill="none" />
        </g>
      ))}
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let nextDraftId = 1;
function makeDraft(plantType: PlantId, color: string): DraftPlant {
  return { id: `garden-draft-${nextDraftId++}`, plantType, stage: PLANT_CATALOG[plantType].svgStage, color, position: null };
}

function loadGardenLocal(): PlantedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as PlantedItem[] : [];
  } catch {
    return [];
  }
}

function saveGardenLocal(items: PlantedItem[]) {
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
  const { identity } = useGuestIdentity();
  const [items, setItems] = useState<PlantedItem[]>(loadGardenLocal);
  const [drafts, setDrafts] = useState<DraftPlant[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [poofs, setPoofs] = useState<{ id: string; x: number; y: number }[]>([]);

  const [plantType, setPlantType] = useState<PlantId>('sunflower');
  const [qty, setQty] = useState(1);
  const [plantColor, setPlantColor] = useState(COLORS[0].hex);

  const [gardenerName, setGardenerName] = useState('');
  const [downloading, setDownloading] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);

  // Load the household's garden from the server once logged in. If the
  // server has nothing yet but this browser has a local garden, migrate it.
  useEffect(() => {
    const token = identity?.sessionToken;
    if (!token) return;
    getGarden(token).then(({ items: serverItems }) => {
      if (serverItems.length === 0) {
        const local = loadGardenLocal();
        if (local.length > 0) {
          setItems(local);
          saveGardenToServer(token, local).catch(() => {});
          return;
        }
      }
      setItems(serverItems as PlantedItem[]);
    }).catch(() => {});
  }, [identity?.sessionToken]);

  const persistGarden = (next: PlantedItem[]) => {
    setItems(next);
    if (identity?.sessionToken) {
      saveGardenToServer(identity.sessionToken, next).catch(() => {});
    } else {
      saveGardenLocal(next);
    }
  };

  const unplacedDrafts = drafts.filter(d => !d.position);
  const active = drafts.find(d => d.id === activeId && !d.position) ?? unplacedDrafts[0] ?? null;

  const unitPrice = PLANT_CATALOG[plantType].stage.price;
  const plantColorable = PLANT_CATALOG[plantType].stage.colorable;

  const handlePay = () => {
    trackClick({
      sessionToken: identity?.sessionToken,
      label: 'garden_pay_venmo',
      metadata: { qty, plantType, amount: qty * unitPrice },
    });
    openVenmo(qty * unitPrice, `Krakoff Wedding -- Garden Fund: $${qty * unitPrice}`);
  };

  const handleAddDrafts = () => {
    const fresh = Array.from({ length: qty }, () => makeDraft(plantType, plantColorable ? plantColor : COLORS[0].hex));
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
    persistGarden(merged);

    setPoofs(prev => [...prev, ...newItems.map(it => ({ id: it.id, x: it.x, y: it.y }))]);
    newItems.forEach(it => {
      setTimeout(() => setPoofs(prev => prev.filter(p => p.id !== it.id)), 700);
    });

    setDrafts([]);
    setActiveId(null);
  };

  const handleReset = () => {
    if (!confirm('Clear your whole garden? This cannot be undone.')) return;
    setDrafts([]);
    setActiveId(null);
    persistGarden([]);
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

  const gardenValue = items.reduce((sum, it) => sum + PLANT_CATALOG[it.plantType].stage.price, 0);

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
                        title={`${PLANT_CATALOG[it.plantType].label} — ${PLANT_CATALOG[it.plantType].stage.label}`}
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

                  {active && (
                    <p className="text-xs text-center text-foreground/30 mt-3 font-light">
                      Tap anywhere on the grass to plant — avoid the pond and statue
                    </p>
                  )}
                </div>
              </Reveal>

              {/* Sidebar */}
              <Reveal direction="right" className="w-full lg:w-[22rem] lg:flex-shrink-0">
                <div className="space-y-5">

                  {/* Step indicator */}
                  <div className="flex items-center text-[10px] tracking-[0.25em] uppercase font-light text-foreground/35">
                    <span className={!active ? 'text-primary' : ''}>Shop</span>
                    <div className="flex-1 h-px bg-foreground/10 mx-3" />
                    <span className={active ? 'text-primary' : ''}>Plant</span>
                  </div>

                  {/* Choose a plant */}
                  <div className="bg-foreground/[0.03] rounded-2xl p-5">
                    <div className="text-xs tracking-[0.3em] uppercase text-primary/55 mb-1 font-light">
                      Plant Something
                    </div>
                    <p className="text-xs font-light text-foreground/40 mb-4 leading-relaxed">
                      Choose a plant, then pick how many to add to your garden.
                    </p>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {PLANT_ORDER.map(id => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setPlantType(id)}
                          className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                            plantType === id
                              ? 'border-primary/40 bg-white shadow-sm'
                              : 'border-foreground/10 hover:border-foreground/20 bg-white/40'
                          }`}
                        >
                          <PlantSVG
                            type={id}
                            stage={PLANT_CATALOG[id].svgStage}
                            color={PLANT_CATALOG[id].stage.colorable ? plantColor : '#9ca3af'}
                            size={36}
                          />
                          <span className="text-xs font-light text-foreground/70">{PLANT_CATALOG[id].label}</span>
                          <span className="text-[10px] font-light text-foreground/40">${PLANT_CATALOG[id].stage.price} each</span>
                        </button>
                      ))}
                    </div>

                    {plantColorable && (
                      <div className="mb-4">
                        <div className="text-[10px] tracking-[0.2em] uppercase text-foreground/35 mb-2 font-light">
                          Pick a color
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {COLORS.map(c => (
                            <button
                              key={c.hex}
                              type="button"
                              title={c.name}
                              onClick={() => setPlantColor(c.hex)}
                              style={{ backgroundColor: c.hex }}
                              className={`w-7 h-7 rounded-full transition-all duration-150 ${
                                plantColor === c.hex
                                  ? 'ring-2 ring-offset-2 ring-foreground/40 scale-110'
                                  : 'hover:scale-105'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-[10px] tracking-[0.2em] uppercase text-foreground/35 mb-2 font-light">
                      How many?
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {QTY_OPTIONS.map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setQty(n)}
                          className={`w-9 h-9 rounded-full border text-xs font-light transition-all ${
                            qty === n
                              ? 'border-primary/50 bg-primary/10 text-foreground'
                              : 'border-foreground/15 text-foreground/60 hover:border-foreground/30'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <p className="text-sm font-light text-foreground/60 mb-4">
                      {qty} {PLANT_CATALOG[plantType].label}{qty > 1 ? 's' : ''} × ${unitPrice} = <span className="text-foreground">${qty * unitPrice}</span>
                    </p>

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
                      Already paid? Add {qty} to plant
                    </button>
                  </div>

                  {/* Place your plants */}
                  {drafts.length > 0 && (
                    <div className="bg-accent/[0.07] ring-1 ring-accent/25 rounded-2xl p-5">
                      <div className="text-xs tracking-[0.3em] uppercase text-accent/80 mb-1 font-light">
                        Place Your Plants
                      </div>
                      <p className="text-xs font-light text-foreground/50 mb-4 leading-relaxed">
                        {drafts.filter(d => d.position).length} of {drafts.length} placed — tap a spot on the grass to plant, avoiding the pond and statue.
                      </p>

                      {drafts.length > 1 && (
                        <div className="space-y-3 mb-4">
                          {PLANT_ORDER.filter(id => drafts.some(d => d.plantType === id)).map(id => {
                            const group = drafts.filter(d => d.plantType === id);
                            return (
                              <div key={id}>
                                <div className="text-[10px] tracking-[0.2em] uppercase text-foreground/35 mb-1.5 font-light">
                                  {PLANT_CATALOG[id].label} · {group.filter(d => d.position).length}/{group.length} placed
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {group.map(d => (
                                    <button
                                      key={d.id}
                                      type="button"
                                      onClick={() => !d.position && setActiveId(d.id)}
                                      className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all bg-white ${
                                        d.id === active?.id ? 'ring-2 ring-offset-2 ring-primary/50' : 'opacity-70 hover:opacity-100'
                                      }`}
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
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {active && (
                        <p className="text-xs font-light text-foreground/40 mb-4">
                          Already placed a plant by mistake? Tap it in the garden to pick it back up.
                        </p>
                      )}

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
                  )}

                  {/* Keep / download */}
                  <div className="bg-foreground/[0.03] rounded-2xl p-5">
                    <div className="text-xs tracking-[0.3em] uppercase text-primary/55 mb-4 font-light">
                      Keep Your Garden
                    </div>
                    <Input
                      value={gardenerName}
                      onChange={e => setGardenerName(e.target.value)}
                      placeholder="Label your garden (optional)"
                      className="font-light mb-3 bg-white"
                      maxLength={40}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleDownload}
                        disabled={downloading || items.length === 0}
                        className="flex-1 py-3 rounded-full border border-foreground/15 hover:border-foreground/30 disabled:opacity-30 disabled:cursor-not-allowed text-foreground/70 text-xs tracking-[0.2em] uppercase font-light transition-colors bg-white"
                      >
                        {downloading ? 'Saving…' : 'Download'}
                      </button>
                      <button
                        type="button"
                        onClick={handleReset}
                        disabled={items.length === 0}
                        className="py-3 px-4 rounded-full border border-foreground/10 hover:border-destructive/40 hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed text-foreground/40 text-xs tracking-[0.2em] uppercase font-light transition-colors bg-white"
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
