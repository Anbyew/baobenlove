import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Plus, GripVertical, X, Download, Upload, FileDown, RotateCcw, Search, Minus, ZoomIn, ZoomOut, Lock, Unlock } from 'lucide-react';
import { GUESTS, type Guest } from '../data/seatingGuests';
import { DEFAULT_TABLES, ROOM_WIDTH, ROOM_HEIGHT, type TableSpec } from '../data/seatingLayout';
import { API_BASE, SEATING_SECRET, SEATING_VENDOR_AUTH_KEY } from '../lib/backdoor';

// ── Persistence ───────────────────────────────────────────────────────────
// The server (one shared row, see server/db.js) is the source of truth —
// every browser that opens this page sees the same floor plan. Local
// storage is kept alongside it purely as an instant local cache: it's what
// renders on first paint (no blank flash while the fetch is in flight) and
// what the page falls back to if the server's briefly unreachable.


// Fire-and-forget activity log — this page has its own vendor password
// instead of a guest session, so this is the only record of who's opening
// it and what they're doing here. Never blocks or surfaces an error; a
// failed log shouldn't get in the way of actually using the tool.
function logSeatingActivity(eventType: string, label?: string, metadata?: Record<string, unknown>) {
  fetch(`${API_BASE}/seating/activity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-seating-secret': VENDOR_PASSWORD },
    body: JSON.stringify({ eventType, label, metadata }),
  }).catch(() => {});
}

// v3: redrawn for the real room — one wide hall (entrance, two table blocks,
// sweetheart/dance floor/DJ table down the center) instead of two rooms.
// Bumping the key each time the default floor plan itself changes shape so
// an already-saved layout reseeds instead of keeping the old positions.
const STORAGE_KEY = 'baoben-seating-chart-v4';

interface Assignment {
  tableId: string;
  seatIndex: number;
}
type Assignments = Record<string, Assignment>;

interface StoredState {
  tables: TableSpec[];
  assignments: Assignments;
}

function loadState(): StoredState {
  let stored: StoredState | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredState;
      if (Array.isArray(parsed.tables) && parsed.assignments) stored = parsed;
    }
  } catch {
    // fall through to defaults
  }
  if (!stored) return { tables: JSON.parse(JSON.stringify(DEFAULT_TABLES)) as TableSpec[], assignments: {} };

  // Heal, don't replace: if a piece was added to the default floor plan
  // after this browser last saved (a new table, a new landmark), append
  // just that piece at its default spot instead of discarding everything
  // already arranged.
  const existingIds = new Set(stored.tables.map((t) => t.id));
  const missing = DEFAULT_TABLES.filter((t) => !existingIds.has(t.id));
  if (missing.length) {
    return { ...stored, tables: [...stored.tables, ...(JSON.parse(JSON.stringify(missing)) as TableSpec[])] };
  }
  return stored;
}

// ── Geometry ──────────────────────────────────────────────────────────────
// Seat positions never change with the verbose toggle — full names radiate
// outward from the same dots as little flower-petal labels (see SeatLabel)
// instead of the seats themselves growing, so the floor plan stays exactly
// as compact either way.

function seatOffsets(table: TableSpec): { x: number; y: number }[] {
  const { shape, seats, w, h } = table;
  if (seats === 0) return [];
  if (shape === 'round') {
    const r = w / 2 + 24;
    return Array.from({ length: seats }, (_, i) => {
      const angle = (i / seats) * Math.PI * 2 - Math.PI / 2;
      return { x: w / 2 + r * Math.cos(angle), y: h / 2 + r * Math.sin(angle) };
    });
  }
  // A 2-seat rect table is a sweetheart-style table — both seats belong
  // side by side on the same edge (the north/top side of the table), not
  // split front/back. Larger rectangular tables still split evenly across
  // both long sides.
  const top = seats <= 2 ? seats : Math.ceil(seats / 2);
  const bottom = seats - top;
  const offsets: { x: number; y: number }[] = [];
  for (let i = 0; i < top; i++) offsets.push({ x: (w / (top + 1)) * (i + 1), y: -24 });
  for (let i = 0; i < bottom; i++) offsets.push({ x: (w / (bottom + 1)) * (i + 1), y: h + 24 });
  return offsets;
}

const SIDE_COLOR: Record<Guest['side'], string> = { Ben: 'var(--primary)', Yuwei: 'var(--accent)' };

const MEAL_ABBR: Record<string, string> = {
  Duck: 'Duck',
  Cod: 'Cod',
  Wellington: 'Veg',
  "Children's": 'Kids',
  'No meal (baby under 6mo)': '—',
};

// Seat circles are colored by meal choice, not by side — lets a glance at
// the floor plan show the kitchen's course counts per table.
const MEAL_COLOR: Record<string, string> = {
  Cod: '#eab308',
  Duck: '#ec4899',
  Wellington: '#22c55e',
  "Children's": '#3b82f6',
  'No meal (baby under 6mo)': '#9ca3af',
};

// RSVP free-text for "no dietary restriction" comes back as all of these —
// only a real answer should light up the dietary-flag dot.
const NO_DIETARY = new Set(['none', 'n/a', 'na', 'no', '无']);
function hasDietary(guest: Guest): boolean {
  const d = guest.dietary.trim().toLowerCase();
  return d.length > 0 && !NO_DIETARY.has(d);
}

function initials(g: Guest) {
  return `${g.firstName[0] ?? ''}${g.lastName[0] ?? ''}`.toUpperCase();
}

// ── Drag payloads ─────────────────────────────────────────────────────────

type DragItem =
  | { guestId: string; from: 'pool' }
  | { guestId: string; from: 'seat'; tableId: string; seatIndex: number };

// ── Seat ──────────────────────────────────────────────────────────────────

function Seat({
  x,
  y,
  index,
  tableId,
  guest,
  locked,
  onDrop,
  onShowInfo,
}: {
  x: number;
  y: number;
  index: number;
  tableId: string;
  guest: Guest | undefined;
  locked: boolean;
  onDrop: (item: DragItem, dest: Assignment) => void;
  onShowInfo: (guestId: string, clientX: number, clientY: number) => void;
}) {
  const [{ isDragging }, dragRef] = useDrag<DragItem, unknown, { isDragging: boolean }>(
    () => ({
      type: 'GUEST',
      item: guest ? { guestId: guest.id, from: 'seat', tableId, seatIndex: index } : undefined,
      canDrag: !locked && !!guest,
      collect: (m) => ({ isDragging: m.isDragging() }),
    }),
    [guest, tableId, index, locked],
  );
  const [{ isOver }, dropRef] = useDrop<DragItem, unknown, { isOver: boolean }>(
    () => ({
      accept: 'GUEST',
      drop: (item) => onDrop(item, { tableId, seatIndex: index }),
      collect: (m) => ({ isOver: m.isOver() }),
    }),
    [tableId, index, onDrop],
  );

  return (
    <div
      ref={(node) => {
        dragRef(node);
        dropRef(node);
      }}
      onClick={(e) => { if (guest) { e.stopPropagation(); onShowInfo(guest.id, e.clientX, e.clientY); } }}
      title={guest ? `${guest.firstName} ${guest.lastName} · click for details` : `Seat ${index + 1}`}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        opacity: isDragging ? 0.35 : 1,
        borderColor: guest ? MEAL_COLOR[guest.mainCourse] : undefined,
        background: isOver ? 'var(--accent)' : guest ? `color-mix(in srgb, ${MEAL_COLOR[guest.mainCourse]} 18%, var(--card))` : 'transparent',
      }}
      className={`h-9 w-9 rounded-full border-2 flex items-center justify-center text-[11px] font-medium select-none transition-colors ${
        locked ? (guest ? 'cursor-pointer' : 'cursor-default') : 'cursor-grab active:cursor-grabbing'
      } ${guest ? 'shadow-sm text-foreground' : 'border-dashed border-foreground/25 text-foreground/30'} ${isOver && !guest ? 'border-accent text-white' : ''}`}
    >
      {guest ? initials(guest) : index + 1}
      {guest && hasDietary(guest) && (
        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-destructive border border-card" />
      )}
    </div>
  );
}

// ── Name label (verbose mode) ────────────────────────────────────────────
// The seat dot never changes size or position — a short leader line points
// out from it at that seat's own angle, ending in a small always-horizontal
// name tag. Rotating the text itself read as clutter (near-vertical labels
// at the top/bottom of a table are genuinely hard to read); a leader-line
// callout, the same trick pie charts use, stays legible at every angle.

function SeatLabel({ table, ox, oy, guest }: { table: TableSpec; ox: number; oy: number; guest: Guest }) {
  const cx = table.w / 2;
  const cy = table.h / 2;
  const isRound = table.shape === 'round';
  const angleRad = isRound ? Math.atan2(oy - cy, ox - cx) : oy < 0 ? -Math.PI / 2 : Math.PI / 2;

  const dotEdge = 26; // clears the 36px seat dot with a little breathing room
  const leaderLen = 15;
  const ex = ox + dotEdge * Math.cos(angleRad);
  const ey = oy + dotEdge * Math.sin(angleRad);
  const lx = ex + leaderLen * Math.cos(angleRad);
  const ly = ey + leaderLen * Math.sin(angleRad);

  // Round tables: tag sits to whichever side of the table its seat is on.
  // Rect tables (a straight row, not a ring): tag centers under the leader.
  const side: 'left' | 'right' | 'center' = !isRound ? 'center' : Math.cos(angleRad) >= 0 ? 'right' : 'left';
  const tagTransform = side === 'center' ? 'translate(-50%, -50%)' : side === 'right' ? 'translate(0, -50%)' : 'translate(-100%, -50%)';

  return (
    <>
      <div
        className="absolute pointer-events-none"
        style={{
          left: ex,
          top: ey,
          width: leaderLen,
          height: 1,
          background: 'var(--border)',
          transformOrigin: '0 50%',
          transform: `rotate(${(angleRad * 180) / Math.PI}deg)`,
        }}
      />
      <div
        className="absolute pointer-events-none whitespace-nowrap text-[10px] font-medium text-foreground bg-card/95 rounded px-1.5 py-0.5 shadow-sm border border-border/60"
        style={{ left: lx, top: ly, transform: tagTransform }}
      >
        {guest.firstName} {guest.lastName}
      </div>
    </>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────

function TableView({
  table,
  selected,
  verbose,
  locked,
  guestBySeat,
  onDrop,
  onShowInfo,
  onStartDrag,
  onRename,
  onRestep,
  onDelete,
}: {
  table: TableSpec;
  selected: boolean;
  verbose: boolean;
  locked: boolean;
  guestBySeat: (index: number) => Guest | undefined;
  onDrop: (item: DragItem, dest: Assignment) => void;
  onShowInfo: (guestId: string, clientX: number, clientY: number) => void;
  onStartDrag: (id: string, e: React.PointerEvent) => void;
  onRename: (id: string, name: string) => void;
  onRestep: (id: string, delta: number) => void;
  onDelete: (id: string) => void;
}) {
  const offsets = useMemo(() => seatOffsets(table), [table.shape, table.seats, table.w, table.h]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(table.name);

  // The whole table body is draggable, not just the grip handle — except
  // rename/stepper/delete controls, which must still get a normal click.
  // The grip is marked data-drag-handle so it always starts a drag even
  // though it's a button; the actual drag/select logic lives in the parent
  // (it needs to know about every table for multi-select and snap guides).
  const onBodyDown = (e: React.PointerEvent) => {
    if (locked) return;
    const target = e.target as HTMLElement;
    const control = target.closest('button, input');
    if (control && !control.hasAttribute('data-drag-handle')) return;
    onStartDrag(table.id, e);
  };

  const seated = Array.from({ length: table.seats }, (_, i) => guestBySeat(i)).filter(Boolean).length;

  return (
    <div style={{ position: 'absolute', left: table.x, top: table.y, width: table.w, height: table.h }}>
      <div
        style={{
          width: table.w,
          height: table.h,
          borderRadius: table.shape === 'round' ? '9999px' : 12,
          background: table.seats > 0 ? 'var(--card)' : 'repeating-linear-gradient(45deg, var(--muted), var(--muted) 8px, transparent 8px, transparent 16px)',
          borderColor: table.seats > 0 ? 'var(--border)' : 'var(--muted-foreground)',
          boxShadow: selected ? '0 0 0 3px var(--accent)' : undefined,
        }}
        onPointerDown={onBodyDown}
        className={`group border flex flex-col items-center justify-center text-center px-2 shadow-sm ${locked ? '' : 'cursor-grab active:cursor-grabbing'}`}
      >
        {!locked && (
          <button
            type="button"
            data-drag-handle="true"
            className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-card border border-border flex items-center justify-center text-foreground/40 hover:text-primary cursor-grab active:cursor-grabbing"
            aria-label="Move"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        )}

        {editing && !locked ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => { setEditing(false); onRename(table.id, draft.trim() || table.name); }}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="w-[85%] bg-transparent text-center text-xs font-medium outline-none border-b border-primary cursor-text"
          />
        ) : locked ? (
          <span className="text-xs font-medium leading-tight">{table.name}</span>
        ) : (
          <button type="button" onClick={() => { setDraft(table.name); setEditing(true); }} className="text-xs font-medium leading-tight cursor-pointer">
            {table.name}
          </button>
        )}
        <span className="text-[10px] text-foreground/40 leading-tight mt-0.5">{table.spec}</span>
        {table.seats > 0 && (
          // Fully inside the table body (not pinned to the edge) so it never
          // sits under a seat chip — round tables put a seat near every
          // corner, which used to block this control.
          <div className="flex items-center gap-1 mt-1">
            {!locked && (
              <button
                type="button"
                onClick={() => onRestep(table.id, -1)}
                aria-label="Remove a seat"
                className="h-6 w-6 rounded-full bg-muted border border-border flex items-center justify-center text-foreground/50 hover:text-destructive hover:border-destructive cursor-pointer"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
            )}
            <span className={`text-[10px] w-10 text-center font-medium tabular-nums ${seated === table.seats ? 'text-primary' : 'text-foreground/40'}`}>
              {seated}/{table.seats}
            </span>
            {!locked && (
              <button
                type="button"
                onClick={() => onRestep(table.id, 1)}
                aria-label="Add a seat"
                className="h-6 w-6 rounded-full bg-muted border border-border flex items-center justify-center text-foreground/50 hover:text-primary hover:border-primary cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
        {!locked && (
          <button
            type="button"
            onClick={() => onDelete(table.id)}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-card border border-border flex items-center justify-center text-foreground/30 hover:text-destructive cursor-pointer"
            aria-label="Delete"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {offsets.map((o, i) => (
        <Seat key={i} x={o.x} y={o.y} index={i} tableId={table.id} guest={guestBySeat(i)} locked={locked} onDrop={onDrop} onShowInfo={onShowInfo} />
      ))}
      {verbose && offsets.map((o, i) => {
        const guest = guestBySeat(i);
        return guest ? <SeatLabel key={`label-${i}`} table={table} ox={o.x} oy={o.y} guest={guest} /> : null;
      })}
    </div>
  );
}

// ── Guest row (sidebar) ───────────────────────────────────────────────────

function GuestRow({ guest, assignment, tableName, locked, onUnseat }: { guest: Guest; assignment: Assignment | undefined; tableName: string | undefined; locked: boolean; onUnseat: () => void }) {
  const [{ isDragging }, dragRef] = useDrag<DragItem, unknown, { isDragging: boolean }>(
    () => ({ type: 'GUEST', item: { guestId: guest.id, from: 'pool' }, canDrag: !locked, collect: (m) => ({ isDragging: m.isDragging() }) }),
    [guest.id, locked],
  );
  return (
    <div
      ref={(node) => dragRef(node)}
      style={{ opacity: isDragging ? 0.4 : 1, borderLeftColor: SIDE_COLOR[guest.side] }}
      className={`flex items-center gap-2 px-2.5 py-1.5 border-l-2 rounded-r hover:bg-muted/60 ${locked ? '' : 'cursor-grab active:cursor-grabbing'}`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-tight truncate">{guest.firstName} {guest.lastName}</p>
        <p className="text-[11px] text-foreground/40 truncate">{guest.household}</p>
      </div>
      <span className="text-[10px] uppercase tracking-wide text-foreground/40 shrink-0">{MEAL_ABBR[guest.mainCourse] ?? guest.mainCourse}</span>
      {hasDietary(guest) && <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" title={guest.dietary} />}
      {assignment && !locked ? (
        <button type="button" onClick={onUnseat} className="shrink-0 flex items-center gap-1 text-[10px] bg-muted rounded-full pl-2 pr-1 py-0.5 text-foreground/50 hover:text-destructive">
          {tableName ?? '—'} <X className="h-3 w-3" />
        </button>
      ) : assignment ? (
        <span className="shrink-0 text-[10px] bg-muted rounded-full px-2 py-0.5 text-foreground/40">{tableName ?? '—'}</span>
      ) : null}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

const PRESETS: { label: string; make: () => Omit<TableSpec, 'id' | 'x' | 'y'> }[] = [
  { label: '72" Round (12)', make: () => ({ name: 'New Table', spec: '72" Round · Seats 12', shape: 'round', seats: 12, w: 150, h: 150 }) },
  { label: '60" Round (10)', make: () => ({ name: 'New Table', spec: '60" Round · Seats 10', shape: 'round', seats: 10, w: 130, h: 130 }) },
  { label: 'Rectangular (8)', make: () => ({ name: 'New Table', spec: '8 ft Rectangular · Seats 8', shape: 'rect', seats: 8, w: 200, h: 70 }) },
  { label: 'Landmark (0 seats)', make: () => ({ name: 'New Item', spec: 'Landmark', shape: 'round', seats: 0, w: 60, h: 60 }) },
];

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 1.6;
const SNAP_THRESHOLD_PX = 8; // screen pixels, converted to canvas space by /zoom
const GUIDE_COLOR = '#ff3d81'; // deliberately outside the site palette — tool chrome, never content

function SeatingChartInner() {
  const [{ tables, assignments }, setState] = useState<StoredState>(loadState);
  const [search, setSearch] = useState('');
  const [sideFilter, setSideFilter] = useState<'all' | Guest['side']>('all');
  const [unseatedOnly, setUnseatedOnly] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  // View-only toggle, not part of the seating plan itself — persisted
  // separately so it doesn't touch the tables/assignments migration logic.
  const [verbose, setVerbose] = useState(() => localStorage.getItem('baoben-seating-verbose') === 'true');
  useEffect(() => { localStorage.setItem('baoben-seating-verbose', String(verbose)); }, [verbose]);
  const [exportingPdf, setExportingPdf] = useState(false);
  // Read-only by default in every fresh browser (a vendor's, most likely) —
  // switching to edit mode is a one-click, per-browser choice that sticks
  // around for whoever made it, same mechanism as the verbose toggle.
  const [locked, setLocked] = useState(() => localStorage.getItem('baoben-seating-locked') !== 'false');
  useEffect(() => { localStorage.setItem('baoben-seating-locked', String(locked)); }, [locked]);
  const customCount = useRef(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Zoom, multi-select, marquee, and snap guides ─────────────────────────
  const [zoom, setZoom] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [guides, setGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });
  const [marquee, setMarquee] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [info, setInfo] = useState<{ guestId: string; x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const tablesRef = useRef(tables);
  const selectedIdsRef = useRef(selectedIds);
  const zoomRef = useRef(zoom);
  useEffect(() => { tablesRef.current = tables; }, [tables]);
  useEffect(() => { selectedIdsRef.current = selectedIds; }, [selectedIds]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSelectedIds(new Set()); setInfo(null); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onShowInfo = useCallback((guestId: string, x: number, y: number) => setInfo({ guestId, x, y }), []);

  const clientToCanvas = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (clientX - rect.left) / zoomRef.current, y: (clientY - rect.top) / zoomRef.current };
  }, []);

  const zoomBy = useCallback((factor: number) => {
    setZoom((z) => Math.round(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * factor)) * 100) / 100);
  }, []);

  // Local storage is still an instant cache (so the page never opens blank
  // while a request is in flight), but the server — shared by every browser
  // — is the actual source of truth now. On mount, whatever's saved there
  // wins over whatever this browser happened to have cached.
  const hydratedFromServer = useRef(false);
  useEffect(() => {
    fetch(`${API_BASE}/seating`, { headers: { 'x-seating-secret': VENDOR_PASSWORD } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.tables) && data.assignments) {
          setState({ tables: data.tables, assignments: data.assignments });
        }
      })
      .catch(() => {
        // Offline, or the server's unreachable — keep working from the
        // local cache; the debounced save below will retry on its own.
      })
      .finally(() => { hydratedFromServer.current = true; });
  }, []);

  const syncToServer = useCallback((body: StoredState) => {
    fetch(`${API_BASE}/seating`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-seating-secret': VENDOR_PASSWORD },
      body: JSON.stringify(body),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tables, assignments }));
      // Don't push the pre-hydration initial render back up — that would
      // briefly overwrite the server with whatever this browser had stale
      // in local storage, one round-trip before the real fetch lands.
      if (hydratedFromServer.current) syncToServer({ tables, assignments });
    }, 250);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [tables, assignments, syncToServer]);

  // The debounce above can lose the very last change if the tab closes or
  // navigates within that 250ms window (exactly what happened importing a
  // Restore file and immediately switching tabs) — flush synchronously the
  // moment the page is about to go away, on top of the debounced save.
  useEffect(() => {
    const flush = () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (hydratedFromServer.current) {
        // sendBeacon can't set custom headers, so the secret rides in the
        // body instead — the server accepts either.
        navigator.sendBeacon?.(
          `${API_BASE}/seating`,
          new Blob([JSON.stringify({ tables, assignments, secret: VENDOR_PASSWORD })], { type: 'application/json' }),
        );
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tables, assignments }));
    };
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [tables, assignments]);

  const guestById = useMemo(() => new Map(GUESTS.map((g) => [g.id, g])), []);
  const tableById = useMemo(() => new Map(tables.map((t) => [t.id, t])), [tables]);

  const seatMap = useMemo(() => {
    const m = new Map<string, string>(); // `${tableId}:${seatIndex}` -> guestId
    for (const [guestId, a] of Object.entries(assignments)) m.set(`${a.tableId}:${a.seatIndex}`, guestId);
    return m;
  }, [assignments]);

  const moveGuest = useCallback((guestId: string, dest: Assignment | null) => {
    if (locked) return;
    const guestName = (() => {
      const g = guestById.get(guestId);
      return g ? `${g.firstName} ${g.lastName}` : guestId;
    })();
    if (dest) {
      const tableName = tableById.get(dest.tableId)?.name ?? dest.tableId;
      logSeatingActivity('click', `Seated ${guestName} at ${tableName}, seat ${dest.seatIndex + 1}`, { guestId, ...dest });
    } else {
      logSeatingActivity('click', `Unseated ${guestName}`, { guestId });
    }
    setState((prev) => {
      const assignments = { ...prev.assignments };
      const prevAssignment = assignments[guestId];
      if (dest) {
        const occupantId = Object.keys(assignments).find(
          (gid) => gid !== guestId && assignments[gid].tableId === dest.tableId && assignments[gid].seatIndex === dest.seatIndex,
        );
        if (occupantId) {
          if (prevAssignment) assignments[occupantId] = prevAssignment;
          else delete assignments[occupantId];
        }
        assignments[guestId] = dest;
      } else {
        delete assignments[guestId];
      }
      return { ...prev, assignments };
    });
  }, [locked, guestById, tableById]);

  const onDropOnSeat = useCallback((item: DragItem, dest: Assignment) => moveGuest(item.guestId, dest), [moveGuest]);

  const [, poolDropRef] = useDrop<DragItem, unknown, unknown>(
    () => ({ accept: 'GUEST', drop: (item) => { if (item.from === 'seat') moveGuest(item.guestId, null); } }),
    [moveGuest],
  );

  // Starts a drag on pointerdown for one table. Plain click: selects just
  // that table and drags it. Click on a table that's already part of a
  // multi-selection: drags the whole selection together, and — if the
  // pointer never actually moves — collapses the selection back down to
  // just that one table (so a plain click on a group still lets you pick
  // one member out of it). Shift-click: toggles membership, no drag.
  const startTableDrag = useCallback((anchorId: string, e: React.PointerEvent) => {
    if (e.shiftKey) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(anchorId)) next.delete(anchorId); else next.add(anchorId);
        return next;
      });
      return;
    }
    e.preventDefault();
    const startClient = { x: e.clientX, y: e.clientY };
    const currentSelection = selectedIdsRef.current;
    const moveWholeGroup = currentSelection.has(anchorId) && currentSelection.size > 1;
    if (!moveWholeGroup) setSelectedIds(new Set([anchorId]));
    const movingIds = moveWholeGroup ? new Set(currentSelection) : new Set([anchorId]);

    const initial = new Map(tablesRef.current.filter((t) => movingIds.has(t.id)).map((t) => [t.id, { x: t.x, y: t.y }]));
    const anchorInit = initial.get(anchorId);
    const anchorTable = tablesRef.current.find((t) => t.id === anchorId);
    const others = tablesRef.current.filter((t) => !movingIds.has(t.id));
    if (!anchorInit || !anchorTable) return;
    let moved = false;

    const move = (ev: PointerEvent) => {
      const zoomNow = zoomRef.current;
      const dxRaw = (ev.clientX - startClient.x) / zoomNow;
      const dyRaw = (ev.clientY - startClient.y) / zoomNow;
      if (Math.abs(ev.clientX - startClient.x) > 2 || Math.abs(ev.clientY - startClient.y) > 2) moved = true;

      const threshold = SNAP_THRESHOLD_PX / zoomNow;
      const ax = anchorInit.x + dxRaw;
      const ay = anchorInit.y + dyRaw;
      const xTargets = [10, ROOM_WIDTH - 10, ROOM_WIDTH / 2];
      const yTargets = [10, ROOM_HEIGHT - 10, ROOM_HEIGHT / 2];
      others.forEach((t) => { xTargets.push(t.x, t.x + t.w, t.x + t.w / 2); yTargets.push(t.y, t.y + t.h, t.y + t.h / 2); });

      const snapAxis = (candidates: number[], targets: number[]): { delta: number; guide: number } | null => {
        let best: { delta: number; guide: number; dist: number } | null = null;
        for (const c of candidates) {
          for (const t of targets) {
            const dist = Math.abs(c - t);
            if (dist <= threshold && (!best || dist < best.dist)) best = { delta: t - c, guide: t, dist };
          }
        }
        return best ? { delta: best.delta, guide: best.guide } : null;
      };

      const xSnap = snapAxis([ax, ax + anchorTable.w / 2, ax + anchorTable.w], xTargets);
      const ySnap = snapAxis([ay, ay + anchorTable.h / 2, ay + anchorTable.h], yTargets);
      const dx = dxRaw + (xSnap?.delta ?? 0);
      const dy = dyRaw + (ySnap?.delta ?? 0);

      setState((prev) => ({
        ...prev,
        tables: prev.tables.map((t) => {
          const init = initial.get(t.id);
          return init ? { ...t, x: init.x + dx, y: init.y + dy } : t;
        }),
      }));
      setGuides({ x: xSnap ? [xSnap.guide] : [], y: ySnap ? [ySnap.guide] : [] });
    };

    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setGuides({ x: [], y: [] });
      if (!moved && moveWholeGroup) setSelectedIds(new Set([anchorId]));
      if (moved) {
        const label = movingIds.size > 1 ? `Moved ${movingIds.size} tables` : `Moved ${anchorTable.name}`;
        logSeatingActivity('click', label, { tableIds: Array.from(movingIds) });
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, []);

  // Click-drag on empty canvas: marquee-selects every table it touches.
  // Shift adds to the existing selection instead of replacing it.
  const onCanvasPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const shift = e.shiftKey;
    const start = clientToCanvas(e.clientX, e.clientY);
    if (!shift) setSelectedIds(new Set());
    let rect = { x0: start.x, y0: start.y, x1: start.x, y1: start.y };
    setMarquee(rect);

    const move = (ev: PointerEvent) => {
      const cur = clientToCanvas(ev.clientX, ev.clientY);
      rect = { ...rect, x1: cur.x, y1: cur.y };
      setMarquee(rect);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setMarquee(null);
      const rx0 = Math.min(rect.x0, rect.x1);
      const rx1 = Math.max(rect.x0, rect.x1);
      const ry0 = Math.min(rect.y0, rect.y1);
      const ry1 = Math.max(rect.y0, rect.y1);
      if (rx1 - rx0 < 3 && ry1 - ry0 < 3) return; // a plain click, not a drag
      const hit = tablesRef.current.filter((t) => t.x < rx1 && t.x + t.w > rx0 && t.y < ry1 && t.y + t.h > ry0).map((t) => t.id);
      if (hit.length) setSelectedIds((prev) => (shift ? new Set([...prev, ...hit]) : new Set(hit)));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [clientToCanvas]);

  const onRename = useCallback((id: string, name: string) => {
    const oldName = tableById.get(id)?.name;
    if (oldName !== name) logSeatingActivity('click', `Renamed "${oldName ?? id}" to "${name}"`, { tableId: id });
    setState((prev) => ({ ...prev, tables: prev.tables.map((t) => (t.id === id ? { ...t, name } : t)) }));
  }, [tableById]);

  const onRestep = useCallback((id: string, delta: number) => {
    const tableName = tableById.get(id)?.name ?? id;
    logSeatingActivity('click', `${delta > 0 ? 'Added' : 'Removed'} a seat at ${tableName}`, { tableId: id, delta });
    setState((prev) => {
      const table = prev.tables.find((t) => t.id === id);
      if (!table) return prev;
      const seats = Math.max(0, Math.min(20, table.seats + delta));
      const assignments = { ...prev.assignments };
      if (delta < 0) {
        for (const [gid, a] of Object.entries(assignments)) {
          if (a.tableId === id && a.seatIndex >= seats) delete assignments[gid];
        }
      }
      return { tables: prev.tables.map((t) => (t.id === id ? { ...t, seats } : t)), assignments };
    });
  }, [tableById]);

  const onDeleteTable = useCallback((id: string) => {
    const table = tableById.get(id);
    const occupied = Object.values(assignments).some((a) => a.tableId === id);
    if (occupied && !confirm(`${table?.name ?? 'This table'} has guests seated. Delete it and return them to the unseated list?`)) return;
    logSeatingActivity('click', `Deleted table "${table?.name ?? id}"`, { tableId: id });
    setState((prev) => ({
      tables: prev.tables.filter((t) => t.id !== id),
      assignments: Object.fromEntries(Object.entries(prev.assignments).filter(([, a]) => a.tableId !== id)),
    }));
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, [tableById, assignments]);

  const addTable = useCallback((preset: (typeof PRESETS)[number]) => {
    customCount.current += 1;
    const n = customCount.current;
    const spec = preset.make();
    logSeatingActivity('click', `Added a new table: ${spec.name}`);
    setState((prev) => ({
      ...prev,
      tables: [...prev.tables, { ...spec, id: `custom-${Date.now()}-${n}`, x: 20 + ((n - 1) % 5) * 44, y: 20 + Math.floor((n - 1) / 5) * 44 }],
    }));
    setAddOpen(false);
  }, []);

  const resetLayout = useCallback(() => {
    if (!confirm('Reset the floor plan to the venue default and clear every seat assignment?')) return;
    logSeatingActivity('click', 'Reset the floor plan to the venue default');
    setState({ tables: JSON.parse(JSON.stringify(DEFAULT_TABLES)) as TableSpec[], assignments: {} });
    setSelectedIds(new Set());
  }, []);

  const clearSeating = useCallback(() => {
    if (!confirm('Move every guest back to the unseated list? Tables stay put.')) return;
    logSeatingActivity('click', 'Cleared all seat assignments');
    setState((prev) => ({ ...prev, assignments: {} }));
  }, []);

  const exportCsv = useCallback(() => {
    logSeatingActivity('click', 'Exported CSV');
    const rows = [['Table', 'Seat', 'Guest', 'Age Group', 'Side', 'Meal', 'Dietary']];
    tables.filter((t) => t.seats > 0).forEach((t) => {
      for (let i = 0; i < t.seats; i++) {
        const gid = seatMap.get(`${t.id}:${i}`);
        const g = gid ? guestById.get(gid) : undefined;
        rows.push([t.name, String(i + 1), g ? `${g.firstName} ${g.lastName}` : '', g?.ageGroup ?? '', g?.side ?? '', g?.mainCourse ?? '', g && hasDietary(g) ? g.dietary : '']);
      }
    });
    const unseated = GUESTS.filter((g) => !assignments[g.id]);
    if (unseated.length) {
      rows.push([]);
      rows.push(['Unseated', '', '', '', '', '', '']);
      unseated.forEach((g) => rows.push(['', '', `${g.firstName} ${g.lastName}`, g.ageGroup, g.side, g.mainCourse, hasDietary(g) ? g.dietary : '']));
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'seating-chart.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [tables, seatMap, guestById, assignments]);

  // Everything lives in this browser's local storage only — there's no
  // server, so a different browser or baoben.love's own origin starts from
  // scratch. This is the one way to actually move a real arrangement
  // between them: export it here, import it there.
  const exportJson = useCallback(() => {
    logSeatingActivity('click', 'Exported JSON backup');
    const blob = new Blob([JSON.stringify({ tables, assignments }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'seating-chart-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [tables, assignments]);

  const importFileRef = useRef<HTMLInputElement>(null);
  const importJson = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed.tables) || typeof parsed.assignments !== 'object' || parsed.assignments === null) {
          throw new Error('unexpected shape');
        }
        if (!confirm('Replace the current floor plan and seating with this file?')) return;
        logSeatingActivity('click', `Imported floor plan from file "${file.name}"`);
        setState(parsed as StoredState);
        setSelectedIds(new Set());
      } catch {
        alert("That doesn't look like a seating chart export.");
      }
    };
    reader.readAsText(file);
  }, []);

  const filteredGuests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return GUESTS.filter((g) => {
      if (sideFilter !== 'all' && g.side !== sideFilter) return false;
      if (unseatedOnly && assignments[g.id]) return false;
      if (q && !`${g.firstName} ${g.lastName} ${g.household}`.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
  }, [search, sideFilter, unseatedOnly, assignments]);

  const totalGuests = GUESTS.length;
  const seatedCount = Object.keys(assignments).length;
  const totalSeats = tables.reduce((s, t) => s + t.seats, 0);
  const seatableTables = tables.filter((t) => t.seats > 0).length;

  // Renders the floor plan at rest — full names on, unzoomed, nothing
  // selected — captures it as an image, and drops it into a landscape PDF.
  // Restores whatever view state the user actually had once it's done.
  const exportPdf = useCallback(async () => {
    logSeatingActivity('click', 'Exported PDF');
    setExportingPdf(true);
    const prevVerbose = verbose;
    const prevZoom = zoom;
    const prevSelected = selectedIds;
    setSelectedIds(new Set());
    setZoom(1);
    setVerbose(true);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      const node = canvasRef.current;
      if (!node) return;

      // Capture whatever the content actually spans, not the room's
      // nominal size — a dragged table (or a verbose name tag hanging off
      // one) can easily sit outside the original ROOM_WIDTH/HEIGHT box,
      // and a fixed-size capture silently cropped it right at that edge.
      const PAD = 220; // clears a table's seat ring plus a verbose name tag
      let minX = 0, minY = 0, maxX = ROOM_WIDTH, maxY = ROOM_HEIGHT;
      for (const t of tables) {
        minX = Math.min(minX, t.x - PAD);
        minY = Math.min(minY, t.y - PAD);
        maxX = Math.max(maxX, t.x + t.w + PAD);
        maxY = Math.max(maxY, t.y + t.h + PAD);
      }
      const captureW = maxX - minX;
      const captureH = maxY - minY;

      const bg = getComputedStyle(document.body).backgroundColor || '#f0f2f5';
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        backgroundColor: bg,
        width: captureW,
        height: captureH,
        style: { transform: `translate(${-minX}px, ${-minY}px)`, transformOrigin: 'top left' },
      });
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 28;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(15);
      pdf.text('Yuwei & Benjamin — Seating Chart', margin, margin);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(110);
      pdf.text(`${totalGuests} guests · ${seatedCount} seated · ${seatableTables} tables · ${totalSeats} seats`, margin, margin + 14);
      const topY = margin + 26;
      const availW = pageW - margin * 2;
      const availH = pageH - topY - margin;
      const scale = Math.min(availW / captureW, availH / captureH);
      const w = captureW * scale;
      const h = captureH * scale;
      pdf.addImage(dataUrl, 'PNG', margin + (availW - w) / 2, topY, w, h);
      pdf.save('seating-chart.pdf');
    } finally {
      setVerbose(prevVerbose);
      setZoom(prevZoom);
      setSelectedIds(prevSelected);
      setExportingPdf(false);
    }
  }, [verbose, zoom, selectedIds, totalGuests, seatedCount, seatableTables, totalSeats, tables]);

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background">
      <header className="border-b border-border px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 shrink-0">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-foreground/40">baoben.love · private</p>
          <h1 className="text-2xl leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>Seating Chart</h1>
          <Link to="/backdoor" className="text-[10px] tracking-[0.2em] uppercase text-foreground/40 hover:text-foreground/70">
            ← Backdoor
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs tabular-nums text-foreground/60 ml-auto">
          <Stat label="Guests" value={totalGuests} />
          <Stat label="Seated" value={seatedCount} tone={seatedCount === totalGuests ? 'good' : undefined} />
          <Stat label="Unseated" value={totalGuests - seatedCount} tone={totalGuests - seatedCount > 0 ? 'warn' : 'good'} />
          <Stat label="Tables" value={seatableTables} />
          <Stat label="Seats" value={totalSeats} tone={totalSeats < totalGuests ? 'warn' : undefined} />
          <div className="flex items-center gap-2.5 pl-3 border-l border-border">
            <MealLegend color={MEAL_COLOR.Cod} label="Cod" />
            <MealLegend color={MEAL_COLOR.Duck} label="Duck" />
            <MealLegend color={MEAL_COLOR.Wellington} label="Veg" />
            <MealLegend color={MEAL_COLOR["Children's"]} label="Kids" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLocked((v) => !v)}
            title={locked ? 'Viewing only — switch to make changes' : 'Editing — switch to prevent changes'}
            className={`flex items-center gap-1 text-xs rounded-full px-3 py-1.5 border ${locked ? 'border-border text-foreground/60 hover:bg-muted' : 'bg-accent text-white border-accent'}`}
          >
            {locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            {locked ? 'View only' : 'Editing'}
          </button>
          <button
            type="button"
            onClick={() => setVerbose((v) => !v)}
            title={verbose ? 'Show initials, tightly packed' : 'Show full names — spreads tables out for room to read them'}
            className={`text-xs rounded-full px-3 py-1.5 border ${verbose ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground/60 hover:bg-muted'}`}
          >
            {verbose ? 'Full names' : 'Compact'}
          </button>
          {!locked && (
            <div className="relative">
              <button type="button" onClick={() => setAddOpen((v) => !v)} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground rounded-full px-3 py-1.5 hover:opacity-90">
                <Plus className="h-3.5 w-3.5" /> Add table
              </button>
              {addOpen && (
                <div className="absolute right-0 mt-1 bg-card border border-border rounded-md shadow-md py-1 w-44 z-20">
                  {PRESETS.map((p) => (
                    <button key={p.label} type="button" onClick={() => addTable(p)} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-muted">
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button type="button" onClick={exportCsv} className="flex items-center gap-1 text-xs border border-border rounded-full px-3 py-1.5 hover:bg-muted">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button
            type="button"
            onClick={exportPdf}
            disabled={exportingPdf}
            title="Renders the floor plan with full names, regardless of the current view"
            className="flex items-center gap-1 text-xs border border-border rounded-full px-3 py-1.5 hover:bg-muted disabled:opacity-50"
          >
            <FileDown className="h-3.5 w-3.5" /> {exportingPdf ? 'Exporting…' : 'Export PDF'}
          </button>
          <button
            type="button"
            onClick={exportJson}
            title="Everything is stored per-browser — download this to move your arrangement to a different browser or computer"
            className="flex items-center gap-1 text-xs border border-border rounded-full px-3 py-1.5 hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5" /> Backup
          </button>
          {!locked && (
            <>
              <input
                ref={importFileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ''; }}
              />
              <button
                type="button"
                onClick={() => importFileRef.current?.click()}
                title="Load a floor plan + seating file exported from another browser"
                className="flex items-center gap-1 text-xs border border-border rounded-full px-3 py-1.5 hover:bg-muted"
              >
                <Upload className="h-3.5 w-3.5" /> Restore
              </button>
              <button type="button" onClick={clearSeating} className="text-xs border border-border rounded-full px-3 py-1.5 hover:bg-muted">
                Clear seating
              </button>
              <button type="button" onClick={resetLayout} className="flex items-center gap-1 text-xs border border-border rounded-full px-3 py-1.5 hover:bg-muted text-destructive">
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            </>
          )}
        </div>
      </header>

      {totalSeats < totalGuests && (
        <p className="bg-destructive/10 text-destructive text-xs text-center py-1.5">
          {totalGuests - totalSeats} more {totalGuests - totalSeats === 1 ? 'guest' : 'guests'} than seats across the current tables — add a table or grow one to fit everyone.
        </p>
      )}

      <div className="flex flex-1 min-h-0">
        <aside className="w-72 shrink-0 border-r border-border flex flex-col min-h-0 overflow-hidden">
          <div className="p-3 space-y-2 border-b border-border">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search guests…"
                className="w-full pl-8 pr-2 py-1.5 text-sm rounded-md bg-input-background outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              {(['all', 'Ben', 'Yuwei'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSideFilter(s)}
                  className={`px-2 py-0.5 rounded-full border ${sideFilter === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground/50 hover:bg-muted'}`}
                >
                  {s === 'all' ? 'Everyone' : `${s}'s side`}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-1.5 text-[11px] text-foreground/50">
              <input type="checkbox" checked={unseatedOnly} onChange={(e) => setUnseatedOnly(e.target.checked)} className="accent-primary" />
              Unseated only
            </label>
          </div>
          <div ref={(node) => poolDropRef(node)} className="flex-1 overflow-y-auto py-1">
            {filteredGuests.map((g) => (
              <GuestRow
                key={g.id}
                guest={g}
                assignment={assignments[g.id]}
                tableName={assignments[g.id] ? tableById.get(assignments[g.id].tableId)?.name : undefined}
                locked={locked}
                onUnseat={() => moveGuest(g.id, null)}
              />
            ))}
            {filteredGuests.length === 0 && <p className="text-center text-xs text-foreground/30 py-6">No guests match.</p>}
          </div>
        </aside>

        <div className="flex-1 overflow-auto relative">
          <div
            ref={canvasRef}
            onPointerDown={onCanvasPointerDown}
            style={{ width: ROOM_WIDTH, height: ROOM_HEIGHT, transform: `scale(${zoom})`, transformOrigin: 'top left' }}
            className="relative"
          >
            <Zone x={10} y={10} w={ROOM_WIDTH - 20} h={ROOM_HEIGHT - 20} label="Reception Hall" />
            <span
              className="absolute text-[10px] tracking-[0.15em] uppercase text-foreground/30 pointer-events-none"
              style={{ left: 20, top: ROOM_HEIGHT - 22 }}
            >
              ← Entrance
            </span>
            {tables.map((t) => (
              <TableView
                key={t.id}
                table={t}
                selected={selectedIds.has(t.id)}
                verbose={verbose}
                locked={locked}
                guestBySeat={(i) => {
                  const gid = seatMap.get(`${t.id}:${i}`);
                  return gid ? guestById.get(gid) : undefined;
                }}
                onDrop={onDropOnSeat}
                onShowInfo={onShowInfo}
                onStartDrag={startTableDrag}
                onRename={onRename}
                onRestep={onRestep}
                onDelete={onDeleteTable}
              />
            ))}
            {guides.x.map((gx) => (
              <div key={`gx-${gx}`} className="absolute top-0 pointer-events-none" style={{ left: gx, width: 1 / zoom, height: ROOM_HEIGHT, background: GUIDE_COLOR }} />
            ))}
            {guides.y.map((gy) => (
              <div key={`gy-${gy}`} className="absolute left-0 pointer-events-none" style={{ top: gy, height: 1 / zoom, width: ROOM_WIDTH, background: GUIDE_COLOR }} />
            ))}
            {marquee && (
              <div
                className="absolute pointer-events-none border"
                style={{
                  left: Math.min(marquee.x0, marquee.x1),
                  top: Math.min(marquee.y0, marquee.y1),
                  width: Math.abs(marquee.x1 - marquee.x0),
                  height: Math.abs(marquee.y1 - marquee.y0),
                  background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                  borderColor: 'var(--accent)',
                }}
              />
            )}
          </div>

          <div className="fixed bottom-4 right-4 z-30 flex items-center gap-1 bg-card border border-border rounded-full shadow-md px-1.5 py-1">
            <button type="button" onClick={() => zoomBy(1 / 1.2)} className="h-7 w-7 rounded-full flex items-center justify-center text-foreground/50 hover:bg-muted hover:text-foreground" aria-label="Zoom out">
              <ZoomOut className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setZoom(1)} className="text-xs tabular-nums text-foreground/50 hover:text-foreground w-11 text-center" title="Reset zoom">
              {Math.round(zoom * 100)}%
            </button>
            <button type="button" onClick={() => zoomBy(1.2)} className="h-7 w-7 rounded-full flex items-center justify-center text-foreground/50 hover:bg-muted hover:text-foreground" aria-label="Zoom in">
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          {selectedIds.size > 1 && (
            <div className="fixed bottom-4 left-[19rem] z-30 text-xs bg-card border border-border rounded-full shadow-md px-3 py-1.5 text-foreground/60">
              {selectedIds.size} tables selected · drag any one to move them together · <kbd className="text-foreground/40">Esc</kbd> to deselect
            </div>
          )}

          {info && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setInfo(null)} />
              <GuestInfoCard guest={guestById.get(info.guestId)} x={info.x} y={info.y} onClose={() => setInfo(null)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Guest info popover ───────────────────────────────────────────────────
// Click any filled seat to see who's actually in it — the initials only
// carry so much. Positioned at the click point and clamped to stay
// on-screen; a full-viewport click-catcher (rendered by the caller)
// dismisses it.

function GuestInfoCard({ guest, x, y, onClose }: { guest: Guest | undefined; x: number; y: number; onClose: () => void }) {
  if (!guest) return null;
  const width = 260;
  const left = Math.min(Math.max(12, x - width / 2), window.innerWidth - width - 12);
  const top = Math.min(y + 16, window.innerHeight - 220);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{ left, top, width, borderLeftColor: SIDE_COLOR[guest.side], borderLeftWidth: 3 }}
      className="fixed z-50 bg-card border border-border rounded-lg shadow-lg p-3.5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-tight truncate">{guest.firstName} {guest.lastName}</p>
          <p className="text-[11px] text-foreground/40 truncate">{guest.formalParty}</p>
        </div>
        <button type="button" onClick={onClose} className="shrink-0 text-foreground/30 hover:text-foreground cursor-pointer" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>
      <dl className="mt-2.5 space-y-1.5 text-xs">
        <InfoRow label="Side" value={`${guest.side} · ${guest.relation}`} />
        <InfoRow label="Meal" value={guest.mainCourse} />
        <InfoRow label="Dietary" value={hasDietary(guest) ? guest.dietary : 'None noted'} warn={hasDietary(guest)} />
        <InfoRow label="Age" value={guest.ageGroup} />
        {guest.notes && <InfoRow label="Notes" value={guest.notes} />}
      </dl>
    </div>
  );
}

function InfoRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex gap-2">
      <dt className="w-14 shrink-0 text-[10px] uppercase tracking-wide text-foreground/40 pt-0.5">{label}</dt>
      <dd className={warn ? 'text-destructive font-medium' : 'text-foreground/80'}>{value}</dd>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'good' | 'warn' }) {
  return (
    <span>
      <span className={tone === 'warn' ? 'text-destructive font-medium' : tone === 'good' ? 'text-primary font-medium' : 'text-foreground font-medium'}>{value}</span>
      <span className="text-foreground/40"> {label}</span>
    </span>
  );
}

function MealLegend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 normal-case">
      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
      <span className="text-foreground/50">{label}</span>
    </span>
  );
}

function Zone({ x, y, w, h, label }: { x: number; y: number; w: number; h: number; label: string }) {
  return (
    <div
      style={{ position: 'absolute', left: x, top: y, width: w, height: h }}
      className="rounded-2xl border border-dashed border-border pointer-events-none"
    >
      <span className="absolute -top-5 left-1 text-[10px] tracking-[0.15em] uppercase text-foreground/30">{label}</span>
    </div>
  );
}

// ── Vendor gate ───────────────────────────────────────────────────────────
// This page skips the site's guest password + RSVP-email login (see App.tsx)
// so a vendor without an invite can still get in, using a password of its
// own instead. Same client-side-only mechanism as the site's main gate —
// a deterrent for whoever has the link, not a security boundary.

const VENDOR_PASSWORD = SEATING_SECRET;
const VENDOR_AUTH_KEY = SEATING_VENDOR_AUTH_KEY;

function VendorGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(() => localStorage.getItem(VENDOR_AUTH_KEY) === 'true');
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  if (authed) return <>{children}</>;

  const submit = () => {
    if (input === VENDOR_PASSWORD) {
      localStorage.setItem(VENDOR_AUTH_KEY, 'true');
      setAuthed(true);
      logSeatingActivity('login', 'Entered the vendor password');
    } else {
      setError(true);
      setInput('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4 w-full max-w-xs">
        <div className="h-px w-16 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-10" />
        <p className="text-xs tracking-[0.25em] uppercase text-foreground/40 mb-2">baoben.love</p>
        <h1 className="text-2xl mb-6" style={{ fontFamily: 'var(--font-heading)' }}>Seating Chart</h1>
        <input
          type="password"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(false); }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Password"
          autoFocus
          className="w-full border-b border-foreground/20 focus:border-primary bg-transparent py-3 text-center font-light text-foreground placeholder:text-foreground/30 outline-none transition-colors mb-4"
        />
        {error && <p className="text-xs text-destructive mb-3">Incorrect password.</p>}
        <button type="button" onClick={submit} className="w-full bg-primary text-primary-foreground py-3 text-xs tracking-widest uppercase font-light">
          Enter
        </button>
      </div>
    </div>
  );
}

export function SeatingChart() {
  return (
    <VendorGate>
      <DndProvider backend={HTML5Backend}>
        <SeatingChartInner />
      </DndProvider>
    </VendorGate>
  );
}
