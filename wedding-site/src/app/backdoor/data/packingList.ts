// Default packing checklist, built from "Master Organizer.docx" (Sept 27).
// The organizer listed most things 2–3 times (the Oct 1 "Things Bring" list,
// then again under Oct 2 LG setup and Oct 3 Hartefeld setup; shared supplies
// like tape, clips, extension cords and the torch repeated under nearly
// every table). Here every physical item appears exactly once, filed where
// it's packed/needed. Only used to seed the server the first time — after
// that the list lives in the database and is edited from the page.

export interface PackingSeedItem {
  id: string;
  section: string;
  group: string;
  label: string;
  note?: string;
  position: number;
}

type Entry = string | [label: string, note: string];

interface SeedSection {
  title: string;
  groups: { title: string; items: Entry[] }[];
}

export const PACKING_SECTIONS: { title: string; blurb: string }[] = [
  { title: 'Prep before packing', blurb: 'Thu Oct 1 — the night before loading' },
  { title: 'Getting ready', blurb: 'Airbnb (bride) & Best Western (groom) — Sat morning' },
  { title: 'Ceremony · Hartefeld National', blurb: 'In the U-Haul with Kelly & Christina, Sat 9 am' },
  { title: 'Reception · Longwood Gardens', blurb: 'Loaded for Fri 9 am setup' },
  { title: 'Dress-change bag · LG', blurb: 'For photos 4–6 pm and the 6:55 pm change' },
  { title: 'Guest restroom kits ×2', blurb: 'Leave at the LG guest restrooms' },
  { title: 'Paper goods & printing', blurb: 'Print by Tue Sep 29' },
  { title: 'Tools & setup supplies', blurb: 'One shared kit — goes to LG Fri, Hartefeld Sat' },
];

const SEED: SeedSection[] = [
  {
    title: 'Prep before packing',
    groups: [
      { title: 'Charge', items: ['Small uplights ×16', 'Seating-chart uplights', 'Photo booth camera', 'LED string lights / LED name sign batteries', 'Torch lighter — refill butane'] },
      { title: 'Iron / steam', items: ['Both wedding dresses', 'Veils & sleeves', 'Wedding party dresses & suits', 'Ribbons (gold, blue)', 'Chuppah white fabrics ×4', 'Backdrop blue fabric'] },
      { title: 'Flowers', items: [['Flowers into buckets, fresh-cut', 'Mix in flower food; keep cool/warm per variety']] },
    ],
  },
  {
    title: 'Getting ready',
    groups: [
      { title: 'Bride — clothing', items: ['Wedding dress 1 (ceremony)', 'Veils', 'Sleeves', 'Wedding shoes', 'Other heels', 'Welcome dinner dress (Fri)', 'Robe'] },
      { title: 'Bride — underthings', items: ['Padded underwear', 'Strapless bra', 'Body tape & nipple stickers'] },
      { title: 'Jewelry & rings', items: ['Wedding rings (both)', 'Engagement ring', 'Necklace', 'Earrings'] },
      { title: 'Hair', items: ['Hair extensions & bang extensions', 'Hair ties, clips, bows'] },
      { title: 'Makeup', items: ['Makeup bag', 'Foundations (new)', 'Eye shadow palette', 'Eyeliners', 'Long lashes & lash clusters', 'Double eyelid tape', 'Lip gloss', 'Setting spray'] },
      { title: 'Skincare & personal', items: ['Baby oil', 'Cotton pads', 'Face masks', 'Whitening strips', 'Moisturizer', 'Perfume', 'Bandages', 'Heel stickers', 'Swing pack'] },
      { title: 'Groom (Best Western)', items: ['Suit', 'Shirts (+1 spare)', 'Shoes', 'Dress socks', 'Mirror for groom getting ready', 'Lunch for groomsmen'] },
      { title: 'Wedding party', items: ["Yutian's dress", 'Bridesmaid robes ×4', 'Groomsmen bow ties', 'Pocket squares', 'Cufflinks'] },
      { title: 'Everyday clothes (both)', items: ['Puffer jacket', 'Rain jacket', 'Jeans, shirts, hoodies', 'Sports bra, leggings, t-shirts', 'Pajamas', 'Socks, underwear, bras', 'Comfortable shoes, sandals'] },
    ],
  },
  {
    title: 'Ceremony · Hartefeld National',
    groups: [
      { title: 'Chuppah', items: ['2 plant stands + middle black metal pieces', '2 poles', '4 white fabrics', '4 hanging plants + hooks + pots (black & brown)', 'Green artificial vines', 'Black heavy-duty metal hooks', 'Brown string'] },
      { title: 'Welcome sign', items: [['Welcome sign box + small plastic vases inside', 'Moves to LG stage for cocktail hour, then reception door'], 'Easel'] },
      { title: 'Seating & aisle', items: ['Reserved sign (first row)', "Ben's grandpa's photo (first row)", 'Wide blue ribbon (aisle seats)', 'Skinny blue ribbon (aisle seats)', 'Flower cones (aisle seats)', 'Hole punch', 'Fans for every seat', 'Flower petals for the aisle'] },
      { title: 'Ceremony items', items: ['Binder — John & Luba speeches', 'Vow books', 'Our vows', 'Glass + bags (breaking the glass)'] },
      { title: 'Ring bearer (Noah)', items: ['Ring box', 'Suitcase', 'Sunglasses ×2', ['Actual rings', 'Hand to Noah — same rings as in Jewelry']] },
      { title: 'Flower girl', items: ['Flower basket', 'Artificial flower petals'] },
      { title: 'From florist (confirm on arrival, 11 am)', items: ['2 asymmetrical chuppah floor pieces', 'Bridal bouquet', '4 bridesmaid bouquets', '2 mom bouquets', 'Groom boutonniere', '9 groomsmen boutonnieres', ['Fans for bouquets', 'Drop off to Molly Mon 9/28']] },
    ],
  },
  {
    title: 'Reception · Longwood Gardens',
    groups: [
      { title: 'Seating chart display', items: ['Black metal frames', 'Blue cheesecloths ×6', 'Artificial flowers', 'Bottle ring'] },
      { title: 'Flower wheel', items: [['Wheel', 'Seating chart → moves to backdrop for reception'], 'Tupperware containers', 'Flowers for wheel'] },
      { title: 'Guest table', items: ['Guest book', 'Pen + pen holder', 'Gift card box', 'Candles'] },
      { title: 'Photo booth', items: ['Camera', 'Printer', 'Props', ['Table', 'Confirm LG provides it']] },
      { title: 'Backdrop', items: ['Gold arch', 'LED lights', ['LED name sign', 'Also to the welcome dinner Fri'], 'Blue fabric', 'Paper flowers & artificial lights', 'Swimming tubes', ['Weights', 'For both sides of the arch, if needed']] },
      { title: 'Dinner tables', items: ['LED string lights', 'Candles + candle holders', 'Chocolates (1 per seat)'] },
      { title: 'Sweetheart table', items: ['Hurricane candles', ['Chuppah flower pieces', 'Bring over from Hartefeld'], 'Blue vases'] },
      { title: 'Cake & dessert tables', items: ['Cake stand', ['Acrylic cake riser', 'Maybe'], ['Floral fabric', 'Maybe'], 'Cake cutting set', 'Flower petals for top of cake', ['Blue table runners', 'Maybe'], ['Cooler + ice', 'Cake overnight at Airbnb Fri']] },
      { title: 'Vases & flower foam', items: ['Centerpiece vases', 'Blue vases', 'Bud vases (guest, cocktail & dessert tables, around cake)', 'Flower foam (bricks + sausage)'] },
      { title: 'Lighting', items: ['Small uplights ×16 (rooms)', 'Seating-chart uplights'] },
      { title: 'Send-off & extras', items: ['Sparklers', 'Broccoli bouquet', ['Shoe game questions', 'Give to Kelly for DJ']] },
    ],
  },
  {
    title: 'Dress-change bag · LG',
    groups: [
      { title: 'Change bag', items: ['Wedding dress 2', 'Flat white shoes', 'Makeup pack (touch-ups)', 'Curling iron + heat glove', 'Hair pieces', 'Giant Q-tips'] },
    ],
  },
  {
    title: 'Guest restroom kits ×2',
    groups: [
      { title: 'Each kit', items: ['Mouthwash + mini cups', 'Dental floss', 'Makeup remover', 'Q-tips', 'Common pills (pain, antacid, allergy)', 'Tide pen'] },
    ],
  },
  {
    title: 'Paper goods & printing',
    groups: [
      { title: 'Ceremony', items: ['Programs (E + C) with QR code', ['Program hand-out', 'Assign someone at the entrance']] },
      { title: 'Reception', items: ['Seating charts', 'Table numbers + holders', 'Name tags + holders + food indicators', 'Sweetheart name tags + holder', 'Dinner menus (E + C), 1 per seat', 'Pastry menu / dessert tags + holders (E + C)', 'Bar signs + holders'] },
    ],
  },
  {
    title: 'Tools & setup supplies',
    groups: [
      { title: 'Tools', items: ['Wagon', 'Ladder', 'Electric drill', 'Screwdrivers', 'Steamer', 'Hot glue gun + glue sticks', 'Torch lighter + butane (sparklers too)', 'Lighter', 'Scissors', 'Garden shears', 'Gardening gloves'] },
      { title: 'Tape', items: ['Measuring tape', 'Packing tape', 'Double-sided tape', 'Black electrical tape', 'Small single-sided tape'] },
      { title: 'Fasteners', items: ['Zip ties', 'Clips', 'Gardening wire', 'Gold ribbon', 'Blue ribbon'] },
      { title: 'Power', items: ['Extension cords', 'Blob heads (plug adapters)', 'Batteries'] },
      { title: 'Wrap & bags', items: ['Bubble wrap', 'Plastic wrap', 'Zipper bags', 'Green floral wrap'] },
    ],
  },
];

export const DEFAULT_PACKING_ITEMS: PackingSeedItem[] = (() => {
  const out: PackingSeedItem[] = [];
  let position = 0;
  SEED.forEach((section, si) => {
    section.groups.forEach((group, gi) => {
      group.items.forEach((entry, ii) => {
        const [label, note] = typeof entry === 'string' ? [entry, undefined] : entry;
        position += 1;
        out.push({ id: `seed-${si}-${gi}-${ii}`, section: section.title, group: group.title, label, note, position });
      });
    });
  });
  return out;
})();
