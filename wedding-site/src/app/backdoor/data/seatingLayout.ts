// The actual room: one long, narrow hall, not two separate rooms. Entrance
// at the far left (photobooth + high-tops), then a block of guest tables,
// then the sweetheart table / dance floor / DJ table down the center, then
// the second block of guest tables toward the far end.
// Positions below are just a sensible starting arrangement; every item is
// draggable on the canvas, and the user's arrangement is what persists.

export type Shape = 'round' | 'rect';

export interface TableSpec {
  id: string;
  name: string;
  /** Real-world description, shown as a caption under the name. */
  spec: string;
  shape: Shape;
  /** Seats guests can be dragged into. 0 = a landmark piece with no seats
   * (cake table, dance floor, cocktail tables, ...). */
  seats: number;
  /** Footprint in px at the default zoom — width for rect, diameter for round. */
  w: number;
  h: number;
  x: number;
  y: number;
}

// Overall room footprint at this layout's default zoom — wide and shallow,
// matching the venue. Used to size the canvas and the room outline.
export const ROOM_WIDTH = 2400;
export const ROOM_HEIGHT = 600;

// Left block — 6 × 72" round, seats 12. Two rows of three, right after the
// entrance cluster.
const leftGuestTables: TableSpec[] = [];
for (let i = 0; i < 6; i++) {
  leftGuestTables.push({
    id: `table-72-${i + 1}`,
    name: `Table ${i + 1}`,
    spec: '72" Round · Seats 12',
    shape: 'round',
    seats: 12,
    w: 150,
    h: 150,
    x: 340 + (i % 3) * 250,
    y: 130 + Math.floor(i / 3) * 250,
  });
}

// Right block — 7 × 60" round, seats 10 (Table 7 was cut; the remaining
// tables kept their original numbers 8–14 rather than shift down). Four
// across the front row, three centered behind them, past the dance floor
// toward the far end of the hall. Columns step wider than the left block's
// (220 vs 250) because they're a smaller table on a shorter step — still
// enough to clear each table's seat ring.
const rightGuestTables: TableSpec[] = [
  { num: 8, x: 1540, y: 130 },
  { num: 9, x: 1760, y: 130 },
  { num: 10, x: 1980, y: 130 },
  { num: 11, x: 2200, y: 130 },
  { num: 12, x: 1650, y: 380 },
  { num: 13, x: 1870, y: 380 },
  { num: 14, x: 2090, y: 380 },
].map(({ num, x, y }) => ({
  id: `table-60-${num - 6}`,
  name: `Table ${num}`,
  spec: '60" Round · Seats 10',
  shape: 'round' as Shape,
  seats: 10,
  w: 130,
  h: 130,
  x,
  y,
}));

export const DEFAULT_TABLES: TableSpec[] = [
  // Entrance — far left: check-in, photos, a place to hold a drink.
  {
    id: 'welcome-2',
    name: 'Welcome Table',
    spec: '6 ft Rectangular',
    shape: 'rect',
    seats: 0,
    w: 150,
    h: 60,
    x: 30,
    y: 50,
  },
  {
    id: 'photobooth',
    name: 'Photobooth Table',
    spec: 'High Cocktail Table',
    shape: 'round',
    seats: 0,
    w: 64,
    h: 64,
    x: 50,
    y: 170,
  },
  ...[0, 1, 2, 3].map((i) => ({
    id: `cocktail-${i + 1}`,
    name: 'Cocktail Table',
    spec: 'High Cocktail Table',
    shape: 'round' as Shape,
    seats: 0,
    w: 56,
    h: 56,
    x: 30 + (i % 2) * 90,
    y: 280 + Math.floor(i / 2) * 90,
  })),

  ...leftGuestTables,

  // Center — sweetheart table, cake and dessert alongside it, the dance
  // floor below, DJ table facing the floor from the far side.
  {
    id: 'cake',
    name: 'Cake Table',
    spec: 'Small Round · Cocktail Height',
    shape: 'round',
    seats: 0,
    w: 64,
    h: 64,
    x: 1040,
    y: 50,
  },
  {
    id: 'sweetheart',
    name: 'Sweetheart Table',
    spec: '6 ft Rectangular · Seats 2',
    shape: 'rect',
    seats: 2,
    w: 150,
    h: 60,
    x: 1140,
    y: 50,
  },
  {
    id: 'dessert',
    name: 'Dessert Table',
    spec: '6 ft Rectangular',
    shape: 'rect',
    seats: 0,
    w: 150,
    h: 60,
    x: 1330,
    y: 50,
  },
  {
    id: 'dance-floor',
    name: 'Dance Floor',
    spec: '20 × 20 ft',
    shape: 'rect',
    seats: 0,
    w: 325,
    h: 325,
    x: 1057,
    y: 138,
  },
  {
    id: 'dj-table',
    name: 'DJ Table',
    spec: '6 ft Rectangular',
    shape: 'rect',
    seats: 0,
    w: 150,
    h: 60,
    x: 1150,
    y: 483,
  },

  ...rightGuestTables,
];
