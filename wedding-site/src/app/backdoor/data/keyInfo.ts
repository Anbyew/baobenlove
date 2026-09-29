// Seed content for /backdoor/info — key locations and the people directory.
// Compiled Sept 27 from the bellabenbao@gmail.com inbox, guests.tsv, the RSVP
// export, backdoor/vendors/vendors.md and backdoor/master-timeline/data/timeline.json. Only
// used to create the document the first time; after that the saved copy on
// the server is the source of truth and is edited from the page.
//
// Real phone numbers and emails were stripped from this file on 2026-09-27
// (this whole doc ships in the public JS bundle, gate or no gate) — the
// production database was seeded with the real values directly, so this
// blanked-out version is only ever used as a fallback on a fresh/local
// database. Fill contacts back in from the live page, not by editing here.
//
// Pronunciations for Chinese names are pinyin-based suggestions; anything
// uncertain is marked with "?" — confirm with the person.

export interface KeyLocation {
  id: string;
  section: string;
  name: string;
  role: string;
  address: string;
  // Extra addresses at the same place, one per line as "Label: address".
  moreAddresses: string;
  when: string;
  contact: string;
  notes: string;
  // Optional Chinese overrides typed on the page (otherwise keyInfoZh.ts).
  nameZh?: string;
  roleZh?: string;
  whenZh?: string;
  notesZh?: string;
}

export interface KeyPerson {
  id: string;
  group: string;
  name: string;
  role: string;
  pronunciation: string;
  phone: string;
  email: string;
  dietary?: string;
  // English level (bride's relatives) or Chinese level (everyone else who
  // speaks some), from the RSVP language questions.
  language?: string;
  notes: string;
  // Optional Chinese overrides typed on the page (otherwise keyInfoZh.ts).
  nameZh?: string;
  roleZh?: string;
  dietaryZh?: string;
  notesZh?: string;
}

export interface KeyInfoDoc {
  version: 1;
  locations: KeyLocation[];
  people: KeyPerson[];
}

export const PEOPLE_GROUPS = [
  'Us',
  'Planner',
  'Bride side family',
  'Groom side family',
  "Groom's extended family",
  'Wedding party — bridesmaids',
  'Wedding party — groomsmen',
  'Kids & +1s',
  'Helpers',
  'Ceremony',
  'Vendors',
  'Venue staff',
] as const;

type L = Omit<KeyLocation, 'id'>;
type P = [name: string, role: string, pronunciation: string, phone: string, email: string, notes?: string];

// Three groups: event venues, getting-ready spaces, guest hotels (the
// shuttle stops). Best Western is both — groom gets ready there and it's a
// shuttle stop — so it appears in both groups. "when" and "notes" are short
// bullet points, one per line. Airports, the train station and vendor
// addresses are deliberately left out.
export const LOCATION_SECTIONS = ['Venues', 'Getting ready', 'Guest hotels'] as const;

// Shown under each group heading as bullet points (one per line).
export const LOCATION_SECTION_BLURBS: Record<string, string> = {
  'Guest hotels': 'Sat 1:45–2:10 pm pickups\nHotels → Hartefeld → Longwood\nSat 11 pm return',
};

const [VENUES, READY, HOTELS] = LOCATION_SECTIONS;

const LOCATIONS: L[] = [
  {
    section: VENUES, name: 'Longwood Gardens', role: 'Reception',
    address: '1001 Longwood Rd, Kennett Square, PA 19348',
    moreAddresses: 'Bus & vendor drop-off: 409 Conservatory Rd, Kennett Square, PA 19348\nBus pickup, 11 pm: 419 Conservatory Rd, Kennett Square, PA 19348',
    when: 'Fri 9 am setup\nSat 4 pm photos\nSat 6 pm cocktails\nSat 7:10 pm reception\nSat 11 pm last dance',
    contact: 'Sam Richards',
    notes: '',
  },
  {
    section: VENUES, name: 'Hartefeld National', role: 'Ceremony',
    address: '1 Hartefeld Dr, Avondale, PA 19311', moreAddresses: '',
    when: 'Fri 3:00 pm rehearsal\nSat 9:30 am setup\nSat 2:45 pm shuttle arrives\nSat 3:00 pm ceremony',
    contact: 'Brianna Boyens',
    notes: '',
  },
  {
    section: VENUES, name: 'Eggspectation - Christiana', role: 'Welcome dinner',
    address: '507 Stanton Christiana Rd, Newark, DE 19713', moreAddresses: '',
    when: 'Fri 6:20 pm leave\nFri 7–10 pm dinner',
    contact: '',
    notes: 'Catering by Limestone BBQ and Bourbon (see Vendors)',
  },
  {
    section: READY, name: 'Airbnb', role: 'Bride & bridesmaids',
    address: '181 Ivy Lane, Glen Mills, PA 19342', moreAddresses: '',
    when: 'Thu–Sun our base\nFri night cake stays here\nSat 7 am hair & makeup\nSat 2 pm leave',
    contact: 'Emily',
    notes: 'U-Haul parked here',
  },
  {
    section: READY, name: 'Best Western Plus Concordville', role: 'Groom & groomsmen',
    address: '675 Conchester Hwy, Concordville, PA 19342', moreAddresses: '',
    when: 'Sat 10 am arrive\nSat 2 pm shuttle',
    contact: '',
    notes: '',
  },
  {
    section: HOTELS, name: 'Holiday Inn Express West Chester', role: 'Stop 1',
    address: '1310 Wilmington Pike, West Chester, PA 19382', moreAddresses: '',
    when: 'Sat 1:45 pm shuttle',
    contact: 'Jackie Berry',
    notes: '',
  },
  {
    section: HOTELS, name: 'Best Western Plus Concordville', role: 'Stop 2',
    address: '675 Conchester Hwy, Concordville, PA 19342', moreAddresses: '',
    when: 'Sat 2:00 pm shuttle',
    contact: '',
    notes: 'Groom gets ready here',
  },
  {
    section: HOTELS, name: 'Home2 Suites Glen Mills', role: 'Stop 3',
    address: '75 Applied Bank Blvd, Glen Mills, PA 19342', moreAddresses: '',
    when: 'Sat 2:10 pm shuttle',
    contact: 'Carla Tomoschuk',
    notes: '',
  },
];

const PREFERRED = '★ Preferred contact — good English';

const PEOPLE: Record<(typeof PEOPLE_GROUPS)[number], P[]> = {
  Us: [
    ['Joint email', 'Designated wedding contact', '', '', 'bellabenbao@gmail.com'],
    ['Yuwei (Emily) Bao', 'Bride', 'YOO-way BOW (Bao rhymes with "how")', '', ''],
    ['Benjamin (Ben) Krakoff', 'Groom', 'KRAY-koff', '', ''],
  ],
  Planner: [
    ['Kelly Altier', 'Wedding planner (Kelly Altier Weddings)', 'AL-tee-er ?', '', '', 'Day-of point of contact'],
    ['Christina', 'Planner assistant', '', '', '', 'Drives U-Haul Sat; picks up cake'],
  ],
  'Bride side family': [
    ['Huankang Bao', "Bride's father", 'hwahn-KAHNG BOW', '', '', 'Chinese only'],
    ['Shuying Sun', "Bride's mother", 'shoo-YING SWUN (like "soon")', '', '', 'Basic English'],
    ['Yujie Bao ★', "Bride's family", 'yoo-JYEH BOW', '', '', `${PREFERRED} · FIRST CHOICE. Canadian number. Driving; arrives EWR Wed 9/30`],
    ['Huiqin Gu', "Bride's family", 'hway-CHIN GOO', '', '', 'Chinese only'],
    ['Yutian Sun ★', "Bride's family · bridesmaid", 'yoo-TYEN SWUN', '', '', PREFERRED],
    ['Guoxin Sun', "Bride's family", 'gwaw-SHIN SWUN', '', '', 'Chinese only'],
    ['Li Sun', "Bride's family", 'LEE SWUN', '', '', 'Chinese only'],
    ['Xiaoqi Bao ★', "Bride's family", 'shyow-CHEE BOW', '', '', PREFERRED],
  ],
  'Groom side family': [
    ['Jonathan Krakoff', "Groom's father", 'KRAY-koff', '', ''],
    ['Leslie Touger', "Groom's mother", 'TOO-ger ?', '', ''],
    ['Emma Krakoff', "Groom's sister · bridesmaid", 'KRAY-koff', '', ''],
    ['Dmitriy Kats', "Emma's partner · groomsman", 'DMEE-tree KAHTS', '', ''],
    ['Noah Krakoff', "Groom's brother · best man", 'KRAY-koff', '', '', 'Holds the rings'],
  ],
  "Groom's extended family": [
    ['Roberta Krakoff', "Groom's grandmother", 'KRAY-koff', '', '', 'Welcome dinner speech'],
    ['John Carlson', 'Officiant · Sarah’s husband', '', '', '', 'Arrives Hartefeld 2:15 pm; reminds families to stay for photos'],
    ['Sarah Krakoff', "Groom's aunt ?", 'KRAY-koff', '', ''],
    ['Lucy Carlson-Krakoff', 'John & Sarah’s daughter ?', 'KRAY-koff', '', '', 'Vegetarian'],
  ],
  'Wedding party — bridesmaids': [
    ['Emma Krakoff', 'Bridesmaid (groom’s sister)', 'KRAY-koff', '', '', 'Also listed under Groom side family'],
    ['Yutian Sun', 'Bridesmaid (bride’s family)', 'yoo-TYEN SWUN', '', '', 'Also listed under Bride side family'],
    ['Liubov (Luba) Samborska', 'Bridesmaid · speech', 'lyoo-BOFF sahm-BOR-skah ?', '', ''],
    ['JingMin Lee', 'Bridesmaid', 'JING-min LEE', '', ''],
  ],
  'Wedding party — groomsmen': [
    ['Noah Krakoff', 'Best man (groom’s brother)', 'KRAY-koff', '', '', 'Also listed under Groom side family'],
    ['Dmitriy Kats', 'Groomsman (Emma’s partner)', 'DMEE-tree KAHTS', '', '', 'Also listed under Groom side family'],
    ['Mark Luzi', 'Groomsman', 'LOO-zee', '', ''],
    ['Coulter L’Heureux', 'Groomsman', 'COLE-ter luh-RUH ?', '', ''],
    ['Andrew Kelly', 'Groomsman', '', '', ''],
    ['Paul Kim', 'Groomsman', '', '', ''],
    ['Jeff Lai', 'Groomsman', 'LYE', '', ''],
    ['Hari Anbarasu', 'Groomsman', 'HAH-ree un-BAH-rah-soo ?', '', ''],
    ['Alexander Jacobson', 'Groomsman', '', '', ''],
  ],
  'Kids & +1s': [
    ['Nico Luzi', 'Flower boy', 'NEE-ko LOO-zee', '', '', 'Mark & Elizabeth’s son'],
    ['Ozzie Leffler Abel', 'Ring bearer', 'LEF-ler AY-bel', '', '', 'Parents: David Abel & Jess Leffler'],
    ['Wolfy Leffler Abel', 'Ring bearer', 'LEF-ler AY-bel', '', '', 'Parents: David Abel & Jess Leffler'],
    ['Jess Leffler', 'Ring bearers’ mom', 'LEF-ler', '', '', 'Contact for Ozzie & Wolfy'],
    ['David Abel', 'Ring bearers’ dad', 'AY-bel', '', '', 'Contact for Ozzie & Wolfy'],
    ['Elizabeth Luzi', 'Mark’s +1 · walker', 'LOO-zee', '', ''],
    ['Rachel L’Heureux', 'Coulter’s +1', 'luh-RUH ?', '', ''],
    ['Lauren Yi', 'Andrew’s +1', 'YEE', '', ''],
    ['Adriana Lai', 'Jeff’s +1', '', '', ''],
    ['Ellis Burgoon Miskell', 'Hari’s +1', 'bur-GOON MISS-kel ?', '', ''],
  ],
  Helpers: [
    ['Linh Nguyen', 'Helper — setup & arrangements', 'LIN WIN (Nguyen ≈ "win")', '', ''],
    ['Trenton Chang', 'Helper', '', '', ''],
    ['Tony (Nuda) Zhang', 'Translator for Chinese-speaking family', 'JAHNG', '', '', 'Speaks English & Chinese'],
  ],
  Ceremony: [
    ['Dan & Katie Fletcher', 'Ceremony musicians', '', '', '', 'Arrive Hartefeld 2:00 pm for sound check'],
  ],
  Vendors: [
    ['Tati Poly', 'Photographer (Tati Poly Photography)', 'TAH-tee PO-lee ?', '', ''],
    ['Kevin & Kaylee', 'Videographer (Silver Shutter Co.)', '', '', '', 'Kevin is main contact; arrive 12:45 pm'],
    ['Jim Pierson', 'DJ (East Coast Entertainment)', '', '', '', 'Booking agent Lamiesse Mekdaschi — '],
    ['Molly & Claire', 'Florist (Full Bloom Designs)', '', '', '', 'Arrive Hartefeld ~11 am'],
    ['Melissa', 'Hair & makeup (Flawless Finish Artistry)', '', '', '', 'Studio 1534 Packer Ave, Philadelphia'],
    ['Delaware Express', 'Shuttle bus — Conf #43189', '', '', '', 'Kathy Houghton (kathy@) · Toni ()'],
    ['Jennifer Ballintyn', "Cake — Spark'd Creative Pastry", '', '', ''],
    ['Limestone BBQ and Bourbon', 'Welcome dinner catering', '', '', ''],
  ],
  'Venue staff': [
    ['Sam Richards', 'Longwood — Event Operations Manager (day-of)', '', '', ''],
    ['Annie Caulfield', 'Longwood — Catering Sales Manager', 'CALL-field', '', ''],
    ['Mary Murphy', 'Longwood — Sales & Client Experience', '', '', ''],
    ['Kevin Kessler', 'Longwood — Director, Event Sales', '', '', ''],
    ['Steven Cox', 'Longwood — Floristry Manager', '', '', ''],
    ['Brianna Boyens', 'Hartefeld National — Event Sales Director', 'BOY-ens', '', ''],
  ],
};

// Only real restrictions, from the RSVP export (meal choices left out). The
// planners' own needs aren't known: Kelly's list to Longwood has 1 peanut
// allergy + 1 no-fish among the vendor meals, not attributed — DJ and
// videographers said they have none.
const PLANNER_DIET = 'Unconfirmed — ask Kelly\nVendor meals: 1 peanut allergy, 1 no fish';
export const DIETARY: Record<string, string> = {
  'Kelly Altier': PLANNER_DIET,
  Christina: PLANNER_DIET,
  'Lucy Carlson-Krakoff': 'Vegetarian',
  'Nico Luzi': 'Lactose intolerant\nNo dairy',
  'Rachel L’Heureux': 'Gluten allergy\nLactose intolerant',
};

// From the RSVP language questions: English level for the bride's relatives;
// for everyone else, only those who speak some Chinese.
export const LANGUAGE: Record<string, string> = {
  'Huankang Bao': 'English: none',
  'Shuying Sun': 'English: basic',
  'Yujie Bao ★': 'English: conversational',
  'Huiqin Gu': 'English: none',
  'Yutian Sun ★': 'English: conversational',
  'Yutian Sun': 'English: conversational',
  'Guoxin Sun': 'English: none',
  'Li Sun': 'English: none',
  'Xiaoqi Bao ★': 'English: conversational',
  'Yuwei (Emily) Bao': 'Speaks Chinese: fluent',
  'JingMin Lee': 'Speaks Chinese: fluent',
  'Trenton Chang': 'Speaks Chinese: fluent',
  'Tony (Nuda) Zhang': 'Speaks Chinese: fluent',
  'Jeff Lai': 'Speaks Chinese: basic',
};

// Short bullet-point notes (one per line), replacing the longer seed notes.
export const NOTES: Record<string, string> = {
  'Huankang Bao': '',
  'Shuying Sun': '',
  'Yujie Bao ★': '★ 1st contact\nCanadian number\nArrives EWR Wed 9/30',
  'Huiqin Gu': '',
  'Yutian Sun ★': '★ Preferred contact',
  'Guoxin Sun': '',
  'Li Sun': '',
  'Xiaoqi Bao ★': '★ Preferred contact',
  'Kelly Altier': 'Day-of contact',
  Christina: 'Drives U-Haul Sat\nPicks up cake',
  'Noah Krakoff': 'Holds the rings',
  'Roberta Krakoff': 'Welcome dinner speech',
  'John Carlson': 'At Hartefeld 2:15 pm',
  'Lucy Carlson-Krakoff': '',
  'Ozzie Leffler Abel': 'Parents: David & Jess',
  'Wolfy Leffler Abel': 'Parents: David & Jess',
  'Jess Leffler': '',
  'David Abel': '',
  'Nico Luzi': 'Mark & Elizabeth’s son',
  'Tony (Nuda) Zhang': '',
  'Dan & Katie Fletcher': 'Sound check 2 pm',
  'Kevin & Kaylee': 'Kevin = main contact\nArrive 12:45 pm',
  'Jim Pierson': 'Agent: ',
  'Molly & Claire': 'At Hartefeld ~11 am',
  'Delaware Express': 'Kathy: \nToni: ',
};
// Wedding-party rows that repeat a family row.
const ALSO_IN_FAMILY = 'Also in family list';

export function buildKeyInfoSeed(): KeyInfoDoc {
  return {
    version: 1,
    locations: LOCATIONS.map((l, i) => ({ id: `loc-${i}`, ...l })),
    people: PEOPLE_GROUPS.flatMap((group) =>
      PEOPLE[group].map(([name, role, pronunciation, phone, email, notes = ''], i) => ({
        id: `p-${group.replace(/\W+/g, '').toLowerCase()}-${i}`,
        group, name, role, pronunciation: pronunciation.replace(/\s*\?$/, ''), phone, email,
        dietary: DIETARY[name] ?? '', language: LANGUAGE[name] ?? '',
        notes: NOTES[name] ?? (notes.startsWith('Also listed under') ? ALSO_IN_FAMILY : notes),
      })),
    ),
  };
}
