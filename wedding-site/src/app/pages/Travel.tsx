import { motion } from 'motion/react';
import { Plane, Hotel, Map, ExternalLink } from 'lucide-react';
import { Reveal } from '../components/Reveal';
import { useLang } from '../context/LanguageContext';

export function Travel() {
  const { t } = useLang();

  const hotels = [
    {
      name: 'Best Western Plus Concordville Hotel',
      mapUrl: 'https://maps.google.com/?q=675+Conchester+Hwy,+Glen+Mills,+PA+19342',
      distance: t.distanceLongwood15,
      hasNote: true,
      link: 'https://www.bestwestern.com/en_US/book/hotel-rooms.39066.html?groupId=4N7TX2L4',
      codeColor: 'text-secondary/65',
    },
    {
      name: 'Home2 Suites by Hilton Glen Mills Chadds Ford',
      mapUrl: 'https://maps.google.com/?q=75+Applied+Bank+Blvd,+Glen+Mills,+PA+19342',
      distance: t.distanceLongwood15,
      hasNote: false,
      link: 'https://www.hilton.com/en/book/reservation/rooms/?ctyhocn=PHLCFHT&arrivalDate=2026-10-02&departureDate=2026-10-04&groupCode=CHT92I&room1NumAdults=1&cid=OM%2CWW%2CHILTONLINK%2CEN%2CDirectLink',
      codeColor: 'text-primary/65',
    },
    {
      name: 'Holiday Inn Express & Suites West Chester',
      mapUrl: 'https://maps.google.com/?q=1310+Wilmington+Pike,+West+Chester,+PA+19382',
      distance: t.distanceLongwood25,
      hasNote: false,
      link: 'https://www.ihg.com/redirect?path=rates&brandCode=EX&regionCode=1&localeCode=en&checkInMonthYear=092026&checkInDate=2&checkOutDate=4&checkOutMonthYear=092026&hotelCode=PHLWP&GPC=KRA&numberOfAdults=1&numberOfRooms=1&adjustMonth=false&showApp=true&monthIndex=00',
      codeColor: 'text-secondary/65',
    },
  ];

  const attractions = [
    { region: t.nearVenueRegion, items: [
      { name: t.longwoodName, description: t.longwoodDesc, mapUrl: 'https://maps.google.com/?q=Longwood+Gardens,+Kennett+Square,+PA', sundayNote: true },
    ]},
    { region: t.phillyRegion, items: [
      { name: t.phillyMuseumName, description: t.phillyMuseumDesc, mapUrl: 'https://maps.google.com/?q=Philadelphia+Museum+of+Art' },
      { name: t.readingMarketName, description: t.readingMarketDesc, mapUrl: 'https://maps.google.com/?q=Reading+Terminal+Market,+Philadelphia' },
    ]},
    { region: t.wilmingtonRegion, items: [
      { name: t.riverfrontName, description: t.riverfrontDesc, mapUrl: 'https://maps.google.com/?q=Riverfront+Wilmington,+DE' },
    ]},
  ];

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 z-0">
        <img src="/Wedding Cherries Web/IMG_0385.jpg" alt="Garden background" className="w-full h-full object-cover" />
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
                  <h1 className="text-5xl md:text-7xl font-light text-foreground tracking-tight">{t.travelTitle}</h1>
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
                  <div className="flex items-center gap-3 mb-10">
                    <Plane className="w-5 h-5 text-primary/40" />
                    <h2 className="text-3xl font-light text-foreground">{t.gettingHereTitle}</h2>
                  </div>
                </Reveal>
                <div className="space-y-8">
                  <Reveal delay={0.08}>
                    <div className="border-b border-foreground/5 pb-8 group">
                      <a href="https://maps.google.com/?q=Philadelphia+International+Airport" target="_blank" rel="noreferrer" className="text-lg font-light text-foreground transition-colors duration-300 group-hover:text-primary">{t.phlAirport}</a>
                      <p className="text-sm font-light text-foreground/65 mt-1">{t.phlDistance}</p>
                    </div>
                  </Reveal>
                  <Reveal delay={0.16}>
                    <div className="border-b border-foreground/5 pb-8 group">
                      <a href="https://maps.google.com/?q=Wilmington+Airport+ILG+Delaware" target="_blank" rel="noreferrer" className="text-lg font-light text-foreground transition-colors duration-300 group-hover:text-primary">{t.ilgAirport}</a>
                      <p className="text-sm font-light text-foreground/65 mt-1">{t.ilgDistance}</p>
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
                  <div className="flex items-center gap-3 mb-10">
                    <Hotel className="w-5 h-5 text-primary/40" />
                    <h2 className="text-3xl font-light text-foreground">{t.whereToStayTitle}</h2>
                  </div>
                </Reveal>
                <div className="space-y-8">
                  {hotels.map((hotel, i) => (
                    <Reveal key={hotel.name} delay={i * 0.1}>
                      <div className="border-b border-foreground/5 pb-8 group">
                        <a href={hotel.mapUrl} target="_blank" rel="noreferrer" className="text-lg font-light text-foreground transition-colors duration-300 group-hover:text-primary">{hotel.name}</a>
                        <p className="text-sm font-light text-foreground/65 mt-1">{hotel.distance}</p>
                        {hotel.link ? (
                          <a href={hotel.link} target="_blank" rel="noreferrer" className={`text-sm font-light mt-3 inline-block underline underline-offset-2 ${hotel.codeColor}`}>
                            {t.bookRoomBlock}
                          </a>
                        ) : (
                          <p className={`text-sm font-light mt-3 ${hotel.codeColor}`}>{t.roomBlockSoon}</p>
                        )}
                        {hotel.hasNote && (
                          <p className="text-sm font-light text-foreground/50 mt-1">{t.bookingNoteRef}</p>
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
                  <div className="flex items-center gap-3 mb-10">
                    <Map className="w-5 h-5 text-primary/40" />
                    <h2 className="text-3xl font-light text-foreground">{t.exploreTitle}</h2>
                  </div>
                </Reveal>
                <div className="space-y-8">
                  {attractions.flatMap((group) =>
                    group.items.map((item, i) => (
                      <Reveal key={item.name} delay={i * 0.08}>
                        <div className="border-b border-foreground/5 pb-8 group">
                          <a href={item.mapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-lg font-light text-primary/80 underline underline-offset-4 decoration-primary/25 hover:decoration-primary hover:text-primary transition-colors duration-300">
                          {item.name}
                          <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </a>
                          <p className="text-sm font-light text-foreground/65 mt-1">{group.region} · {item.description}</p>
                          {item.sundayNote && (
                            <p className="text-sm font-light text-foreground/75 bg-secondary/15 border-l-2 border-secondary rounded-sm pl-3 pr-3 py-2 mt-3 inline-block">
                              {t.longwoodSundayNote}{' '}
                              <a
                                href="https://maps.google.com/?q=1001+Longwood+Road,+Kennett+Square,+PA+19348"
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium underline underline-offset-2 decoration-secondary/50 hover:text-primary transition-colors duration-300"
                              >
                                {t.sundayAccessAddress}
                              </a>
                            </p>
                          )}
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
