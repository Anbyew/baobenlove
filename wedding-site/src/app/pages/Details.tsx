import { motion } from 'motion/react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Reveal } from '../components/Reveal';
import { useLang } from '../context/LanguageContext';

export function Details() {
  const { t } = useLang();
  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 z-0">
        <img src="/Wedding Cherries Web/IMG_0403.jpg" alt="Garden background" className="w-full h-full object-cover" />
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
                  <h1 className="text-5xl md:text-7xl font-light text-foreground tracking-tight">{t.detailsTitle}</h1>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Content panel */}
        <div className="max-w-5xl mx-auto px-4 pb-32">
          <div className="bg-white/80 backdrop-blur-xl shadow-2xl shadow-black/8 border border-white/50 p-8 md:p-16 rounded-sm">

            {/* Ceremony */}
            <div className="mb-16">
              <div className="text-center mb-16">
                <Reveal>
                  <div className="text-sm tracking-[0.3em] uppercase text-primary/55 mb-6 font-light">{t.ceremonyLabel}</div>
                </Reveal>
              </div>
              <div className="grid md:grid-cols-3 gap-12 max-w-3xl mx-auto">
                {[
                  { icon: Calendar, label: t.dateLabel, value: t.date, sub: null, href: null },
                  { icon: Clock, label: t.timeLabel, value: t.ceremonyTime, sub: t.ceremonyArrive, href: null },
                  { icon: MapPin, label: t.locationLabel, value: t.ceremonyVenue, sub: t.ceremonyAddress, href: 'https://maps.google.com/?q=1+Hartefeld+Dr,+Avondale,+PA+19311' },
                ].map((item, i) => (
                  <Reveal key={item.label} delay={i * 0.12} direction="up">
                    <div className="text-center group">
                      <item.icon className="w-7 h-7 text-primary/35 mx-auto mb-4 transition-all duration-300 group-hover:text-primary/60 group-hover:scale-110" />
                      <div className="text-xs tracking-wider uppercase text-foreground/55 mb-3 font-light">{item.label}</div>
                      {item.href ? (
                        <a href={item.href} target="_blank" rel="noreferrer" className="text-lg font-light text-foreground hover:text-primary transition-colors duration-200">{item.value}</a>
                      ) : (
                        <div className="text-lg font-light text-foreground">{item.value}</div>
                      )}
                      {item.sub && <div className="text-sm text-foreground/65 mt-1.5 font-light">{item.sub}</div>}
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

            <Reveal>
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-secondary/30 to-transparent mx-auto my-12" />
            </Reveal>

            {/* Reception */}
            <div className="mb-16">
              <div className="text-center mb-16">
                <Reveal>
                  <div className="text-sm tracking-[0.3em] uppercase text-secondary/55 mb-6 font-light">{t.cocktailReceptionLabel}</div>
                </Reveal>
              </div>
              <div className="grid md:grid-cols-3 gap-12 max-w-3xl mx-auto">
                {[
                  { icon: Calendar, label: t.dateLabel, value: t.date, sub: null, href: null },
                  { icon: Clock, label: t.timeLabel, value: t.receptionTime, sub: t.receptionDinner, href: null },
                  { icon: MapPin, label: t.locationLabel, value: t.receptionVenue, sub: t.receptionAddress, href: 'https://maps.google.com/?q=Longwood+Gardens,+1001+Longwood+Road,+Kennett+Square,+PA+19348' },
                ].map((item, i) => (
                  <Reveal key={item.label} delay={i * 0.12} direction="up">
                    <div className="text-center group">
                      <item.icon className="w-7 h-7 text-secondary/35 mx-auto mb-4 transition-all duration-300 group-hover:text-secondary/60 group-hover:scale-110" />
                      <div className="text-xs tracking-wider uppercase text-foreground/55 mb-3 font-light">{item.label}</div>
                      {item.href ? (
                        <a href={item.href} target="_blank" rel="noreferrer" className="text-lg font-light text-foreground hover:text-secondary transition-colors duration-200">{item.value}</a>
                      ) : (
                        <div className="text-lg font-light text-foreground">{item.value}</div>
                      )}
                      {item.sub && <div className="text-sm text-foreground/65 mt-1.5 font-light">{item.sub}</div>}
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

            <Reveal>
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-primary/30 to-transparent mx-auto my-12" />
            </Reveal>

            {/* Additional info */}
            <div className="grid md:grid-cols-3 gap-16 max-w-4xl mx-auto">
              {[
                { label: t.dressCodeLabel, title: t.dressCodeValue },
                { label: t.weatherLabel, title: t.weatherValue },
                { label: t.parkingLabel, title: t.parkingValue },
              ].map((card, i) => (
                <Reveal key={card.label} delay={i * 0.12}>
                  <div className="text-center">
                    <div className="text-xs tracking-[0.3em] uppercase text-foreground/55 mb-6 font-light">{card.label}</div>
                    <h3 className="text-xl font-light text-foreground">{card.title}</h3>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.15}>
              <div className="flex justify-center items-end gap-1 md:gap-2 mt-16">
                {[
                  { n: 2, rot: -6, w: 88,  y: 10 },
                  { n: 1, rot: -3, w: 128, y: 0  },
                  { n: 7, rot:  3, w: 104, y: 18 },
                  { n: 3, rot: -1, w: 148, y: 4  },
                  { n: 6, rot:  4, w: 112, y: 12 },
                  { n: 5, rot: -5, w: 136, y: 6  },
                ].map(({ n, rot, w, y }) => (
                  <img
                    key={n}
                    src={`/AI/couples/couple_${n}.png`}
                    alt=""
                    className="drop-shadow-lg shrink-0 cursor-default"
                    style={{
                      width: w,
                      transform: `rotate(${rot}deg) translateY(${y}px)`,
                      transition: 'transform 0.35s ease, filter 0.35s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = `rotate(${rot * 0.4}deg) translateY(${y - 14}px) scale(1.1)`;
                      e.currentTarget.style.filter = 'drop-shadow(0 12px 20px rgba(0,0,0,0.18))';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = `rotate(${rot}deg) translateY(${y}px)`;
                      e.currentTarget.style.filter = '';
                    }}
                  />
                ))}
                <img
                  src="/AI/couples/couple_8.png"
                  alt=""
                  className="drop-shadow-lg shrink-0 cursor-default"
                  style={{
                    width: 124,
                    transform: 'rotate(6deg) translateY(20px)',
                    transition: 'transform 0.35s ease, filter 0.35s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'rotate(2.4deg) translateY(6px) scale(1.1)';
                    e.currentTarget.style.filter = 'drop-shadow(0 12px 20px rgba(0,0,0,0.18))';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'rotate(6deg) translateY(20px)';
                    e.currentTarget.style.filter = '';
                  }}
                />
              </div>
            </Reveal>

          </div>
        </div>
      </div>
    </div>
  );
}
