import { motion } from 'motion/react';
import { Reveal } from '../components/Reveal';

const hotels = [
  {
    name: 'Best Western Plus Concordville Hotel',
    mapUrl: 'https://maps.google.com/?q=675+Conchester+Hwy,+Glen+Mills,+PA+19342',
    distance: '~15 min from Longwood Gardens',
    note: 'Call and reference the "Bao/Krakoff Wedding Block," or book using the link below',
    link: 'https://www.bestwestern.com/en_US/book/hotel-rooms.39066.html?groupId=4N7TX2L4',
    codeColor: 'text-secondary/65',
  },
  {
    name: 'Home2 Suites by Hilton Glen Mills Chadds Ford',
    mapUrl: 'https://maps.google.com/?q=75+Applied+Bank+Blvd,+Glen+Mills,+PA+19342',
    distance: '~15 min from Longwood Gardens',
    note: null,
    link: 'https://www.hilton.com/en/book/reservation/rooms/?ctyhocn=PHLCFHT&arrivalDate=2026-10-02&departureDate=2026-10-04&groupCode=CHT92I&room1NumAdults=1&cid=OM%2CWW%2CHILTONLINK%2CEN%2CDirectLink',
    codeColor: 'text-primary/65',
  },
  {
    name: 'Holiday Inn Express & Suites West Chester',
    mapUrl: 'https://maps.google.com/?q=1310+Wilmington+Pike,+West+Chester,+PA+19382',
    distance: '~25 min from Longwood Gardens',
    note: null,
    link: null,
    codeColor: 'text-secondary/65',
  },
];

const attractions = [
  { region: 'Near the Venue', items: [
    { name: 'Longwood Gardens', description: 'Iconic fountains, conservatories, and 1,000 acres of gardens', mapUrl: 'https://maps.google.com/?q=Longwood+Gardens,+Kennett+Square,+PA' },
  ]},
  { region: 'Philadelphia · ~45 min', items: [
    { name: 'Philadelphia Museum of Art', description: 'World-class collections and the legendary Rocky Steps', mapUrl: 'https://maps.google.com/?q=Philadelphia+Museum+of+Art' },
    { name: 'Reading Terminal Market', description: 'A beloved historic market hall filled with incredible local food', mapUrl: 'https://maps.google.com/?q=Reading+Terminal+Market,+Philadelphia' },
  ]},
  { region: 'Wilmington · ~30 min', items: [
    { name: 'Riverfront Wilmington', description: 'Waterfront restaurants, shops, and the lively Christina riverbank', mapUrl: 'https://maps.google.com/?q=Riverfront+Wilmington,+DE' },
  ]},
];

export function Travel() {
  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 z-0">
        <img src="/backgrounds/bg4.jpg" alt="Garden background" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/45 via-white/25 to-white/45" />
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
                  <h1 className="text-5xl md:text-7xl font-light text-foreground tracking-tight">Travel</h1>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Content panel */}
        <div className="max-w-5xl mx-auto px-4 pb-32">
          <div className="bg-white/80 backdrop-blur-xl shadow-2xl shadow-black/8 border border-white/50 p-8 md:p-16 rounded-sm">

            <div className="max-w-3xl mx-auto">

              {/* Getting Here */}
              <div className="mb-16">
                <Reveal>
                  <h2 className="text-3xl font-light text-foreground mb-10">Getting Here</h2>
                </Reveal>
                <div className="space-y-8">
                  <Reveal delay={0.08}>
                    <div className="border-b border-foreground/5 pb-8 group">
                      <a href="https://maps.google.com/?q=Philadelphia+International+Airport" target="_blank" rel="noreferrer" className="text-lg font-light text-foreground transition-colors duration-300 group-hover:text-primary">Philadelphia International Airport (PHL)</a>
                      <p className="text-sm font-light text-foreground/65 mt-1">~45 minutes from venues</p>
                    </div>
                  </Reveal>
                  <Reveal delay={0.16}>
                    <div className="border-b border-foreground/5 pb-8 group">
                      <a href="https://maps.google.com/?q=Wilmington+Airport+ILG+Delaware" target="_blank" rel="noreferrer" className="text-lg font-light text-foreground transition-colors duration-300 group-hover:text-primary">Wilmington Airport (ILG)</a>
                      <p className="text-sm font-light text-foreground/65 mt-1">~30 minutes from venues</p>
                    </div>
                  </Reveal>
                </div>
              </div>

              <Reveal>
                <div className="h-px w-24 bg-gradient-to-r from-transparent via-secondary/30 to-transparent my-16" />
              </Reveal>

              {/* Hotels */}
              <div className="mb-16">
                <Reveal>
                  <h2 className="text-3xl font-light text-foreground mb-10">Where to Stay</h2>
                </Reveal>
                <div className="space-y-8">
                  {hotels.map((hotel, i) => (
                    <Reveal key={hotel.name} delay={i * 0.1}>
                      <div className="border-b border-foreground/5 pb-8 group">
                        <a href={hotel.mapUrl} target="_blank" rel="noreferrer" className="text-lg font-light text-foreground transition-colors duration-300 group-hover:text-primary">{hotel.name}</a>
                        <p className="text-sm font-light text-foreground/65 mt-1">{hotel.distance}</p>
                        {hotel.link ? (
                          <a href={hotel.link} target="_blank" rel="noreferrer" className={`text-sm font-light mt-3 inline-block underline underline-offset-2 ${hotel.codeColor}`}>
                            Book room block →
                          </a>
                        ) : (
                          <p className={`text-sm font-light mt-3 ${hotel.codeColor}`}>Room block link coming soon</p>
                        )}
                        {hotel.note && (
                          <p className="text-sm font-light text-foreground/50 mt-1">Reference: "Bao/Krakoff Wedding Block"</p>
                        )}
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>

              <Reveal>
                <div className="h-px w-24 bg-gradient-to-r from-transparent via-primary/30 to-transparent my-16" />
              </Reveal>

              {/* Explore the Area */}
              <div>
                <Reveal>
                  <h2 className="text-3xl font-light text-foreground mb-10">Explore the Area</h2>
                </Reveal>
                <div className="space-y-8">
                  {attractions.flatMap((group) =>
                    group.items.map((item, i) => (
                      <Reveal key={item.name} delay={i * 0.08}>
                        <div className="border-b border-foreground/5 pb-8 group">
                          <a href={item.mapUrl} target="_blank" rel="noreferrer" className="text-lg font-light text-foreground transition-colors duration-300 group-hover:text-primary">{item.name}</a>
                          <p className="text-sm font-light text-foreground/65 mt-1">{group.region} · {item.description}</p>
                        </div>
                      </Reveal>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
