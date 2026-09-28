// Seed content for /backdoor/setup, adapted from "Master Organizer.docx".
// Only the setup-related parts are here (prep, packing, venue setup, day-of
// switch-on, pack-up) — guest arrivals, dinners and travel are left to the
// master timeline. Item lists are written as indented outlines (2 spaces per
// level) and parsed into trees once, when the checklist is first created or
// reset; after that the saved copy is the source of truth.

export interface SeedSection {
  title: string;
  when?: string;
  where: string;
  who: string[];
  notes?: string;
  link?: { label: string; href: string };
  items: string;
}

export interface SeedDay {
  key: string;
  date: string;
  title: string;
  sections: SeedSection[];
}

export const LG = 'Longwood Gardens';
export const HN = 'Hartefeld National';
const AIRBNB = 'Airbnb, Kennett Square';

export const SETUP_SEED: SeedDay[] = [
  {
    key: 'prep',
    date: 'Sep 27 – 30',
    title: 'Prep week at home',
    sections: [
      {
        title: 'Print everything',
        when: 'Sun Sep 27 – Tue Sep 29',
        where: 'Home, NYC',
        who: ['Yuwei'],
        items: `
Program (EN + CN), with QR code
Menu (EN + CN)
Pastry menu (EN + CN)
Bar sign
Seating chart
Table numbers`,
      },
      {
        title: 'Vendor follow-ups',
        when: 'Sun Sep 27',
        where: 'Phone / email',
        who: ['Yuwei'],
        items: `
DJ
Cake pastry chef
Longwood Gardens — send updated seating chart
Book LG car rental`,
      },
      {
        title: 'Setup errands',
        when: 'Mon Sep 28',
        where: 'Around town',
        who: ['Yuwei'],
        items: `
Drop off fans to florist
Home Depot run
Buy flowers
Get cash`,
      },
      {
        title: 'Final arrangement & packing',
        when: 'Tue Sep 29 – Wed Sep 30',
        where: 'Home, NYC',
        who: ['Yuwei', 'Linh'],
        notes: 'Ask Ben when to leave on Thursday.',
        items: `
Linh comes over for final arrangement
Final prep packing
Learn and practice the dance`,
      },
    ],
  },
  {
    key: 'oct1',
    date: 'Thu Oct 1',
    title: 'Load out & prep at the Airbnb',
    sections: [
      {
        title: 'Load out to Kennett Square',
        when: 'Morning',
        where: 'Home, NYC → ' + AIRBNB,
        who: ['Yuwei', 'Linh', 'Ben', 'Noah'],
        notes: 'Item-by-item packing lives in the Packing Checklist.',
        link: { label: 'Packing Checklist', href: '/backdoor/admin/packing' },
        items: `
Load the U-Haul
Load Yuwei's car
Yuwei & Linh drive down (same time as Ben)
Ben & Noah drop the U-Haul at the Airbnb, then take Yuwei's car`,
      },
      {
        title: 'Flowers & photo booth prep',
        when: 'Afternoon',
        where: AIRBNB,
        who: ['Yuwei', 'Luba', 'Kelly', 'Christina'],
        notes: 'Kelly & Christina land at PHL 1:00 pm and pick up supplies; Luba lands 2:40 pm.',
        items: `
Kelly & Christina pick up supplies
Flowers
  Fresh-cut stems into buckets
  Mix water with flower food
  Keep temperature right for each flower (cool / warm)
Arrange photo booth`,
      },
      {
        title: 'Get-ready setup',
        when: 'Evening',
        where: AIRBNB,
        who: ['Yuwei'],
        items: `
2 dresses ready
  Veils
  Sleeves
Robes laid out
Wedding party dresses & suits ready
Hair & makeup stations set up
Iron / steam
  Clothes
  Ribbons
Charge overnight
  Small uplights
  Torch`,
      },
    ],
  },
  {
    key: 'oct2',
    date: 'Fri Oct 2',
    title: 'Setup at Longwood Gardens',
    sections: [
      {
        title: 'Setup order',
        when: '9:00 am',
        where: LG,
        who: ['Yuwei', 'Luba', 'Linh', 'JungMin', 'Emma', 'Leslie', 'Yutian', 'Shuying'],
        notes: 'JungMin tentative. Driver still TBD.',
        items: `
All major flower vases
  Centerpieces
  Welcome sign
  Wheel
  Cake stand
  Bud vases
Seating chart
Backdrop
Photo booth
All guest tables
Other tables
  Sweetheart table
  Guest table
  Cake table
  Dessert table
  Bars
Other decor
  Ceremony flower cones, bows
  Uplights
  Guest restrooms
  Misc`,
      },
      {
        title: 'Ceremony pieces to prep',
        when: '9:00 am',
        where: LG,
        who: ['Yuwei', 'Luba', 'Linh', 'JungMin', 'Emma', 'Leslie', 'Yutian', 'Shuying'],
        items: `
Welcome sign
  Welcome sign box
  Easel
  Small plastic vases inside the box
Aisle seats
  Wide blue ribbon
  Skinny blue ribbon
  Flower cones
  Hole-punching tool
  Double-sided tape`,
      },
      {
        title: 'Cocktail hour',
        when: '9:00 am',
        where: LG,
        who: ['Yuwei', 'Luba', 'Linh', 'JungMin', 'Emma', 'Leslie', 'Yutian', 'Shuying'],
        items: `
Welcome sign — goes on stage (after ceremony)
Seating chart
  Black metal frames
  Blue cheesecloths ×6
  Printed seating charts
  Artificial flowers
  Bottle ring, tape, clips, hot glue
Flower wheel
  Wheel
  Tupperware
  Flower foam
  Flowers
Uplights
  Charged the night before
  Extension cords
  Blob heads
Guest table
  Guest book
  Pen + pen holder
  Gift card box
  Bud vases / vases + flowers
  Candles
Cocktail tables: bud vases + flowers
Bar: printed bar signs + holders`,
      },
      {
        title: 'Reception',
        when: '9:00 am',
        where: LG,
        who: ['Yuwei', 'Luba', 'Linh', 'JungMin', 'Emma', 'Leslie', 'Yutian', 'Shuying'],
        items: `
Welcome sign — moves to the door (after cocktail hour)
Photo booth
  Camera
  Printer
  Table + props
  Extension cords, black tape
Backdrop
  Gold arch
  LED lights
  LED name lights
  Blue fabric
  Flowers
    Paper flowers, artificial lights
    Swimming tubes
    Flower foam
  Extension cords, black tape, blob heads
  Batteries, clips, tape, zip ties
  Weights on both sides if needed
Dinner tables — centers
  Vases + flowers
  LED string lights + batteries
  Candles + candle holders
  Table number + holder
Dinner tables — per seat
  Printed menu
  Name tag + holder + meal indicator
  Chocolate
Sweetheart table
  Hurricane candles
  Flower pieces from chuppah
  Blue vases + flowers
  Name tags + holders + indicators
Cake table
  Cake stand + flowers + sausage flower foam
  (maybe) acrylic riser
  Flowers around cake
  (maybe) floral fabric
Dessert table
  Dessert tags + holders
  (maybe) blue table runners
  (maybe) bud vases
Uplights ×16 in the rooms
Fake send-off
  Sparklers
  Torch + butane
  Lighter
Broccoli bouquet
Shoe game questions to DJ (Kelly)`,
      },
      {
        title: 'Equipment on site',
        when: '9:00 am',
        where: LG,
        who: ['Yuwei', 'Luba', 'Linh', 'JungMin', 'Emma', 'Leslie', 'Yutian', 'Shuying'],
        items: `
Wagon wheels
Ladder
Electric drill
Screwdrivers
Steamer
Torch lighter + butane
Lighter
Tapes (measuring, packing, double-sided, black electrical, small)
Scissors + gardening scissors
Gardening gloves
Bubble wrap, plastic wrap, zipper bags, green garden wraps
Gardening metal wire
Gold + blue ribbons
Hot glue gun + glue sticks`,
      },
      {
        title: 'Cake pickup',
        when: 'Afternoon',
        where: 'Bakery → ' + AIRBNB,
        who: ['Kelly'],
        items: `
Pick up cake
Cooler + ice
Drop off at the Airbnb`,
      },
      {
        title: 'Welcome dinner',
        when: '6:20 pm depart · 7:00 – 9:00 pm',
        where: 'Welcome dinner venue',
        who: ['Yuwei', 'Ben'],
        items: `
Bring LED name sign
Grandma's speech`,
      },
    ],
  },
  {
    key: 'oct3',
    date: 'Sat Oct 3',
    title: 'Wedding day',
    sections: [
      {
        title: 'Move supplies to Hartefeld',
        when: '9:00 am',
        where: AIRBNB + ' → ' + HN,
        who: ['Kelly', 'Christina'],
        items: `
Pick up U-Haul from the Airbnb
Christina drives the U-Haul
Kelly drives her car`,
      },
      {
        title: 'Ceremony setup',
        when: '9:30 am – 12:30 pm',
        where: HN + ' · 1 Hartefeld Dr, Avondale',
        who: ['Kelly', 'Christina', 'Linh'],
        items: `
Chuppah
  2 plant stands + middle black metal pieces
  2 poles
  4 white fabrics
  4 hanging plants + hooks + pots (black + brown)
  Green artificial vines
  Zip ties, tape, brown string, clips
  Black heavy-duty metal hooks
Welcome sign
  Welcome sign box
  Easel
  Small plastic vases inside the box
Seating — first row
  Reserved sign
  Ben's grandpa's photo
Seating — aisle
  Wide blue ribbon
  Skinny blue ribbon
  Flower cones
  Hole-punching tool
  Double-sided tape
Seating — all seats
  Fans
  Programs (or someone hands them out at the entrance)
Flower petals for the aisle`,
      },
      {
        title: 'Florist delivery',
        when: '11:00 am',
        where: HN,
        who: ['Florist', 'Kelly'],
        items: `
2 asymmetrical floor pieces for the chuppah
Bridal bouquet
4 bridesmaid bouquets + fans
2 moms + fans
Groom's boutonniere
9 groomsmen boutonnieres`,
      },
      {
        title: 'Ceremony items in place',
        where: HN,
        who: ['Kelly'],
        items: `
Binder
  John's speech
  Luba's speech
Vows
  Vow books
  Our vows
Ring bearer
  Ring box
  Suitcase
  Sunglasses ×2
  Actual rings for Noah
Flower girl
  Flower basket
  Artificial flower petals
Breaking the glass
  Glasses + bags`,
      },
      {
        title: 'Cake to Longwood',
        when: '12:30 pm',
        where: AIRBNB + ' → ' + LG,
        who: ['Christina'],
        items: `
Pick up cake from the Airbnb
Uber to LG`,
      },
      {
        title: 'Vendor & walker arrivals',
        when: '1:30 – 2:15 pm',
        where: HN,
        who: ['Kelly'],
        notes: 'Kelly reminds the walkers about processional order.',
        items: `
1:30 pm DJ Jim arrives
2:00 pm Dan & Katie arrive — sound check
2:15 pm John Carlson arrives
Walkers arrive
  Grandma
  Ozzie & Wolfie
  Mark, Elizabeth, Nico`,
      },
      {
        title: 'Cocktail hour switch-on',
        when: 'Before 6:00 pm',
        where: LG,
        who: [],
        notes: 'Not assigned in the organizer yet.',
        items: `
Welcome sign — move from ceremony to stage
Seating chart
  Uplights on
  Wheel in place
Guest table
  Candles on (if hurricane)
  LED lights on
Cocktail tables ready
Bar ready`,
      },
      {
        title: 'Reception flip',
        when: 'Before 7:10 pm entry',
        where: LG,
        who: [],
        notes: 'Not assigned in the organizer yet. Room reveal 6:45 pm.',
        items: `
Welcome sign — move from cocktail hour to the door
Photo booth: camera + printer on
Backdrop
  LED lights on
  LED name lights on
  Blue fabric
  Wheel — move from seating chart
Guest table — move from cocktail hour
Cocktail tables — move from cocktail hour
Bar table — move from cocktail hour
Dinner tables: LED lights on
Sweetheart table
  Hurricane candles on
  Flower pieces from chuppah
Cake table
  LED / candle lights on if used
  (maybe) acrylic riser
  Flowers around cake
  (maybe) floral fabric
  Flower petals on top before serving
  Bring cake right before cutting, fill in with flowers
  Cake cutting set
Dessert table: LED / candle lights on if used
Uplights ×16 on
Fake send-off: sparklers + torch
Broccoli bouquet
Shoe game questions to DJ (Kelly)`,
      },
      {
        title: 'Changeover kit',
        when: '4:00 – 7:00 pm',
        where: LG,
        who: ['Yuwei'],
        notes: 'Dress change + hair/makeup touch-up at 6:55 pm.',
        items: `
Second dress
White flats
Makeup pack
Curling irons
Hair pieces
Hygiene kits ×2 left in guest restrooms`,
      },
    ],
  },
  {
    key: 'wrap',
    date: 'Oct 4 – 5',
    title: 'Pack up, return & sell',
    sections: [
      {
        title: 'Pack up the Airbnb',
        when: 'Sun Oct 4',
        where: AIRBNB,
        who: ['Yuwei', 'Ben', 'Luba', 'JungMin', 'Trenton'],
        items: `
Pack up everything
Load U-Haul`,
      },
      {
        title: 'Return U-Haul',
        when: 'Sun Oct 4, evening',
        where: 'U-Haul drop-off',
        who: ['Ben'],
        items: `
Return U-Haul`,
      },
      {
        title: 'Returns',
        when: 'Mon Oct 5',
        where: 'Home',
        who: [],
        items: `
Amazon
  Bud vases
  Extension cords`,
      },
      {
        title: 'Sell',
        when: 'Mon Oct 5 onward',
        where: 'Home',
        who: [],
        items: `
Vases
  Blue vases
  Bud vases
Candles
  Candle holders
  Candles
Decor
  Chuppah
  Black metal frame
  Easel
  Flower wheel
  Name tag / card holders
  All misc small decor
Fabrics
  Blue long
  Blue table runner
  White ×4
Organizers
  Black bins
  White bins
  Tupperware
  Pen holders
Electronics
  Small uplights`,
      },
    ],
  },
];
