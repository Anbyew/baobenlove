import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, type LucideIcon } from 'lucide-react';

// ─── Temple Run / Flappy Bird style mini-games ─────────────────────────────
// Each fundable item gets one fixed control scheme for its whole playthrough
// (the caller rotates through MODES by item index so consecutive items feel
// different):
//  - "jump" (up): obstacles scroll in along the ground. Tap / Space / Up to
//    jump over them.
//  - "lane" (left/right): obstacles fall from above in one of five lanes.
//    Tap left/right or use the arrow keys to dodge into a clear lane.
//  - "duck" (down): a bar scrolls in overhead. Tap / Down to duck under it.
// Survive N obstacles to win; one hit and you're back to the start. Speed
// ramps up with every obstacle cleared.

interface Obstacle {
  id: number;
  x: number; // 0-100, % of game width
}

interface LaneObstacle {
  id: number;
  lane: number; // 0-4
  y: number; // 0-100, % from top
}

export type Mode = 'jump' | 'lane' | 'duck';

export const MODES: Mode[] = ['jump', 'lane', 'duck'];

const GROUND = 0;
const GRAVITY = 8.5; // tuned so a jump comfortably clears OBSTACLE_HEIGHT
const JUMP_VELOCITY = 210; // %/s
const PLAYER_X_START = 12; // % — starting horizontal position
const PLAYER_X_FINISH = 70; // % — player drives toward here as it nears the goal
const PLAYER_WIDTH = 12; // %
const OBSTACLE_WIDTH = 9; // %
const OBSTACLE_HEIGHT = 26; // % — player must be above this to clear a jump obstacle
const TICK_MS = 16; // ~60fps — keeps input-to-screen delay minimal
const BASE_SPEED = 40; // %/s
const SPEED_STEP = 8; // added per level cleared (duck mode)
const JUMP_SPEED_STEP = 6; // added per level cleared (jump mode)
const HIT_INSET = 2; // % shaved off each side of player/obstacle for a tighter, more forgiving hitbox

const LANES = [10, 30, 50, 70, 90]; // % x-centers for the 5 lanes
const PLAYER_Y_START = 80; // % from top — starting vertical position in lane mode
const PLAYER_Y_FINISH = 25; // % from top — player climbs toward here as it nears the goal
const COLLIDE_BAND = 12; // % tolerance around the player's y for a hit
const LANE_BASE_SPEED = 60; // %/s falling speed
const LANE_SPEED_STEP = 8;
const JUMP_GOAL_MULTIPLIER = 1.5; // jump mode runs longer than duck
const LANE_GOAL_MULTIPLIER = 2; // lane mode runs longer than duck

const DUCK_BAR_BOTTOM = 38; // % — bottom edge of the overhead bar (from the floor)
const DUCK_STAND_BOTTOM = 30; // % — standing player overlaps the bar
const DUCK_CROUCH_BOTTOM = 0; // % — ducked player clears under the bar
const DUCK_TIME_MS = 200; // generous window: must cover the bar's whole pass-through time even with imperfect timing

export function JumpGame({
  mode,
  playerIcon: PlayerIcon,
  obstacleIcon: ObstacleIcon,
  goal,
  onSuccess,
}: {
  mode: Mode;
  playerIcon: LucideIcon;
  obstacleIcon: LucideIcon;
  goal: number;
  onSuccess: () => void;
}) {
  const [cleared, setCleared] = useState(0);

  // Jump / duck mode state (both use horizontally-scrolling obstacles)
  const [playerY, setPlayerY] = useState(GROUND);
  const [obstacles, setObstacles] = useState<Obstacle[]>([{ id: 0, x: 100 }]);
  const [ducking, setDucking] = useState(false);

  // Lane-mode state
  const [playerLane, setPlayerLane] = useState(2);
  const [laneObstacles, setLaneObstacles] = useState<LaneObstacle[]>([{ id: 0, lane: 0, y: -10 }]);

  const [status, setStatus] = useState<'playing' | 'success' | 'fail'>('playing');
  const [hasMoved, setHasMoved] = useState(false);

  const velocityRef = useRef(0);
  const nextIdRef = useRef(1);
  const duckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mirror fast-changing state in refs so input handlers always see the
  // latest value without forcing the keyboard listener to be re-attached
  // on every game tick (which was adding a frame or two of input lag).
  const playerYRef = useRef(playerY);
  const duckingRef = useRef(ducking);
  const playerLaneRef = useRef(playerLane);
  useEffect(() => { playerYRef.current = playerY; }, [playerY]);
  useEffect(() => { duckingRef.current = ducking; }, [ducking]);
  useEffect(() => { playerLaneRef.current = playerLane; }, [playerLane]);

  // Lane mode runs a bit longer than jump/duck. The player also visibly
  // advances toward the finish line as obstacles are cleared, so each
  // round feels like real progress rather than standing still.
  const targetGoal = mode === 'lane'
    ? Math.round(goal * LANE_GOAL_MULTIPLIER)
    : mode === 'jump'
    ? Math.round(goal * JUMP_GOAL_MULTIPLIER)
    : goal;
  const advance = Math.min(cleared, targetGoal) / targetGoal;
  const playerX = PLAYER_X_START + advance * (PLAYER_X_FINISH - PLAYER_X_START);
  const playerYLane = PLAYER_Y_START + advance * (PLAYER_Y_FINISH - PLAYER_Y_START);

  // ── Jump / duck mode loop (horizontal scroll) ───────────────────────────
  useEffect(() => {
    if (status !== 'playing' || (mode !== 'jump' && mode !== 'duck')) return;
    const id = setInterval(() => {
      const dt = TICK_MS / 1000;
      const speed = BASE_SPEED + cleared * (mode === 'jump' ? JUMP_SPEED_STEP : SPEED_STEP);

      if (mode === 'jump') {
        velocityRef.current -= GRAVITY * dt * 60;
        setPlayerY(y => Math.max(GROUND, y + velocityRef.current * dt));
      }

      setObstacles(prev => {
        let next = prev.map(o => ({ ...o, x: o.x - speed * dt }));

        for (const o of next) {
          // Shrink both boxes inward so the hit only registers when the
          // player and obstacle visuals are actually touching.
          const overlapsX = o.x + HIT_INSET < playerX + PLAYER_WIDTH - HIT_INSET && o.x + OBSTACLE_WIDTH - HIT_INSET > playerX + HIT_INSET;
          if (!overlapsX) continue;
          if (mode === 'jump' && playerY < OBSTACLE_HEIGHT) setStatus('fail');
          if (mode === 'duck') {
            if (!duckingRef.current) {
              setStatus('fail');
            } else {
              // Keep ducked until the bar has fully passed — reset the timer
              // on every tick while the obstacle still overlaps so the player
              // can't accidentally stand up mid-obstacle.
              if (duckTimeoutRef.current) clearTimeout(duckTimeoutRef.current);
              duckTimeoutRef.current = setTimeout(() => {
                duckingRef.current = false;
                setDucking(false);
              }, DUCK_TIME_MS);
            }
          }
        }

        const passed = next.filter(o => o.x + OBSTACLE_WIDTH < playerX);
        if (passed.length) {
          setCleared(c => c + passed.length);
          next = next.filter(o => o.x + OBSTACLE_WIDTH >= playerX);
        }

        const gap = mode === 'jump' ? 75 + Math.random() * 30 : 60 + Math.random() * 25;
        if (next.length === 0 || Math.max(...next.map(o => o.x)) < 100 - gap) {
          next.push({ id: nextIdRef.current++, x: 110 });
        }

        return next;
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [status, mode, cleared, playerY, ducking, playerX]);

  // ── Lane mode loop (vertical fall) ──────────────────────────────────────
  useEffect(() => {
    if (status !== 'playing' || mode !== 'lane') return;
    const id = setInterval(() => {
      const dt = TICK_MS / 1000;
      const speed = LANE_BASE_SPEED + cleared * LANE_SPEED_STEP;

      setLaneObstacles(prev => {
        let next = prev.map(o => ({ ...o, y: o.y + speed * dt }));

        for (const o of next) {
          if (o.lane === playerLane && Math.abs(o.y - playerYLane) < COLLIDE_BAND) {
            setStatus('fail');
          }
        }

        const passed = next.filter(o => o.y > 100);
        if (passed.length) {
          setCleared(c => c + passed.length);
          next = next.filter(o => o.y <= 100);
        }

        if (next.length === 0 || Math.min(...next.map(o => o.y)) > 22 + Math.random() * 15) {
          next.push({ id: nextIdRef.current++, lane: Math.floor(Math.random() * LANES.length), y: -10 });
        }

        return next;
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [status, mode, cleared, playerLane, playerYLane]);

  useEffect(() => {
    if (status === 'playing' && cleared >= targetGoal) setStatus('success');
  }, [cleared, targetGoal, status]);

  useEffect(() => {
    if (status !== 'success') return;
    const t = setTimeout(onSuccess, 500);
    return () => clearTimeout(t);
  }, [status, onSuccess]);

  // Snap player to ground once landed
  useEffect(() => {
    if (playerY <= 0 && velocityRef.current < 0) {
      velocityRef.current = 0;
    }
  }, [playerY]);

  const jump = () => {
    if (status !== 'playing' || mode !== 'jump') return;
    if (playerYRef.current <= 0.01) {
      velocityRef.current = JUMP_VELOCITY;
      setHasMoved(true);
    }
  };

  const duck = () => {
    if (status !== 'playing' || mode !== 'duck') return;
    duckingRef.current = true;
    setDucking(true);
    setHasMoved(true);
    if (duckTimeoutRef.current) clearTimeout(duckTimeoutRef.current);
    duckTimeoutRef.current = setTimeout(() => {
      duckingRef.current = false;
      setDucking(false);
    }, DUCK_TIME_MS);
  };

  const moveLane = (dir: -1 | 1) => {
    if (status !== 'playing' || mode !== 'lane') return;
    setPlayerLane(l => Math.min(LANES.length - 1, Math.max(0, l + dir)));
    setHasMoved(true);
  };

  // Keyboard controls
  useEffect(() => {
    if (status !== 'playing') return;
    const handler = (e: KeyboardEvent) => {
      if (mode === 'jump' && (e.code === 'Space' || e.code === 'ArrowUp')) {
        e.preventDefault();
        jump();
      } else if (mode === 'duck' && (e.code === 'Space' || e.code === 'ArrowDown')) {
        e.preventDefault();
        duck();
      } else if (mode === 'lane' && e.code === 'ArrowLeft') {
        e.preventDefault();
        moveLane(-1);
      } else if (mode === 'lane' && e.code === 'ArrowRight') {
        e.preventDefault();
        moveLane(1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [status, mode]);

  const handleTap = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (mode === 'jump') {
      jump();
      return;
    }
    if (mode === 'duck') {
      duck();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    moveLane(tapX < rect.width / 2 ? -1 : 1);
  };

  const retry = () => {
    velocityRef.current = 0;
    if (duckTimeoutRef.current) clearTimeout(duckTimeoutRef.current);
    setPlayerY(GROUND);
    setObstacles([{ id: nextIdRef.current++, x: 100 }]);
    setDucking(false);
    setPlayerLane(2);
    setLaneObstacles([{ id: nextIdRef.current++, lane: Math.floor(Math.random() * LANES.length), y: -10 }]);
    setCleared(0);
    setHasMoved(false);
    setStatus('playing');
  };

  if (status === 'fail') {
    return (
      <div className="text-center py-3">
        <p className="text-sm font-light text-foreground/60 mb-3">Tripped! Back to the start.</p>
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

  const HINT_ICON = mode === 'jump' ? ArrowUp : mode === 'duck' ? ArrowDown : null;
  const headerText =
    mode === 'jump' ? 'Tap to jump' : mode === 'duck' ? 'Tap to duck' : 'Tap left / right to dodge';

  return (
    <>
      <div className="flex items-center justify-between mb-2 text-xs font-light text-foreground/50 tracking-wider">
        <span>{headerText}</span>
        <span>{Math.min(cleared, targetGoal)} / {targetGoal}</span>
      </div>
      <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden mb-3">
        <motion.div
          className="h-full bg-secondary/70 rounded-full"
          animate={{ width: `${advance * 100}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        />
      </div>
      <button
        type="button"
        onClick={handleTap}
        className="relative w-full h-72 rounded-xl bg-foreground/5 overflow-hidden mb-3 select-none"
      >
        {status === 'success' ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm font-light text-primary">
            Made it through! 🎉
          </div>
        ) : mode === 'jump' ? (
          <>
            {/* Ground line */}
            <div className="absolute left-0 right-0 bottom-[18%] h-px bg-foreground/15" />

            {/* Player — drives forward as obstacles are cleared */}
            <div
              className="absolute w-12 h-12 rounded-full bg-white border-2 border-primary/60 shadow-md flex items-center justify-center transition-[left] duration-500 ease-out"
              style={{
                left: `${playerX}%`,
                bottom: `calc(18% + ${playerY}%)`,
                transform: 'translateX(-10%)',
              }}
            >
              <PlayerIcon className="w-6 h-6 text-primary" />
            </div>

            {/* Obstacles */}
            {obstacles.map(o => (
              <div
                key={o.id}
                className="absolute w-10 h-10 rounded-full bg-white border-2 border-secondary/60 shadow-md flex items-center justify-center"
                style={{ left: `${o.x}%`, bottom: '18%' }}
              >
                <ObstacleIcon className="w-5 h-5 text-secondary" />
              </div>
            ))}
          </>
        ) : mode === 'duck' ? (
          <>
            {/* Ground line */}
            <div className="absolute left-0 right-0 bottom-[18%] h-px bg-foreground/15" />

            {/* Player — squishes down to duck under the bar, and drives forward as obstacles are cleared */}
            <div
              className="absolute w-12 h-12 rounded-full bg-white border-2 border-primary/60 shadow-md flex items-center justify-center transition-[bottom,left,transform] duration-150"
              style={{
                left: `${playerX}%`,
                bottom: `${ducking ? DUCK_CROUCH_BOTTOM : DUCK_STAND_BOTTOM}%`,
                transform: `translateX(-10%) scaleY(${ducking ? 0.55 : 1})`,
                transformOrigin: 'bottom',
              }}
            >
              <PlayerIcon className="w-6 h-6 text-primary" />
            </div>

            {/* Overhead bars */}
            {obstacles.map(o => (
              <div
                key={o.id}
                className="absolute w-10 rounded-md bg-white border-2 border-secondary/60 shadow-md flex items-end justify-center pb-1"
                style={{ left: `${o.x}%`, top: 0, bottom: `${DUCK_BAR_BOTTOM}%` }}
              >
                <ObstacleIcon className="w-5 h-5 text-secondary" />
              </div>
            ))}
          </>
        ) : (
          <>
            {/* Lane dividers */}
            <div className="absolute top-0 bottom-0 left-[20%] w-px bg-foreground/10" />
            <div className="absolute top-0 bottom-0 left-[40%] w-px bg-foreground/10" />
            <div className="absolute top-0 bottom-0 left-[60%] w-px bg-foreground/10" />
            <div className="absolute top-0 bottom-0 left-[80%] w-px bg-foreground/10" />

            {/* Player — climbs toward the top as obstacles are cleared */}
            <div
              className="absolute w-12 h-12 rounded-full bg-white border-2 border-primary/60 shadow-md flex items-center justify-center transition-[left,top] duration-150"
              style={{
                left: `${LANES[playerLane]}%`,
                top: `${playerYLane}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <PlayerIcon className="w-6 h-6 text-primary" />
            </div>

            {/* Falling obstacles */}
            {laneObstacles.map(o => (
              <div
                key={o.id}
                className="absolute w-10 h-10 rounded-full bg-white border-2 border-secondary/60 shadow-md flex items-center justify-center"
                style={{ left: `${LANES[o.lane]}%`, top: `${o.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                <ObstacleIcon className="w-5 h-5 text-secondary" />
              </div>
            ))}
          </>
        )}

        {/* Controls hint — fades once the player acts for the first time */}
        {!hasMoved && status !== 'success' && (
          <motion.div
            className="absolute top-2 right-2 flex items-center gap-1.5 pointer-events-none"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {mode === 'lane' ? (
              <>
                <motion.div
                  className="w-10 h-10 rounded-full border-2 border-foreground/25 bg-white/80 shadow-sm flex items-center justify-center"
                  animate={{ x: [0, -2, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ArrowLeft className="w-5 h-5 text-foreground/50" />
                </motion.div>
                <motion.div
                  className="w-10 h-10 rounded-full border-2 border-foreground/25 bg-white/80 shadow-sm flex items-center justify-center"
                  animate={{ x: [0, 2, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
                >
                  <ArrowRight className="w-5 h-5 text-foreground/50" />
                </motion.div>
              </>
            ) : HINT_ICON ? (
              <>
                <motion.div
                  className="w-14 h-7 rounded-md border-2 border-foreground/25 bg-white/80 shadow-sm"
                  animate={{ y: [0, 2, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="w-10 h-10 rounded-full border-2 border-foreground/25 bg-white/80 shadow-sm flex items-center justify-center"
                  animate={{ y: [0, 2, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
                >
                  <HINT_ICON className="w-5 h-5 text-foreground/50" />
                </motion.div>
              </>
            ) : null}
          </motion.div>
        )}
      </button>
    </>
  );
}
