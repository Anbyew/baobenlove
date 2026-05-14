import { motion } from 'motion/react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Reveal } from '../components/Reveal';

export function Details() {
  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 z-0">
        <img src="/Wedding Cherries Web/IMG_0392.jpg" alt="Garden background" className="w-full h-full object-cover" />
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
                  <h1 className="text-5xl md:text-7xl font-light text-foreground tracking-tight">Details</h1>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Content panel */}
        <div className="max-w-5xl mx-auto px-4 pb-32">
          <div className="bg-white/80 backdrop-blur-xl shadow-2xl shadow-black/8 border border-white/50 p-8 md:p-16 rounded-sm">

            {/* Ceremony */}
            <div className="mb-32">
              <div className="text-center mb-16">
                <Reveal>
                  <div className="text-sm tracking-[0.3em] uppercase text-primary/55 mb-6 font-light">Ceremony</div>
                </Reveal>
              </div>
              <div className="grid md:grid-cols-3 gap-12 max-w-3xl mx-auto">
                {[
                  { icon: Calendar, label: 'Date', value: 'October 3, 2026', sub: null, href: null },
                  { icon: Clock, label: 'Time', value: '3:00 PM', sub: 'Arrive by 2:45 PM', href: null },
                  { icon: MapPin, label: 'Location', value: 'Hartefeld National', sub: '1 Hartefeld Dr, Avondale, PA', href: 'https://maps.google.com/?q=1+Hartefeld+Dr,+Avondale,+PA+19311' },
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
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-secondary/30 to-transparent mx-auto my-24" />
            </Reveal>

            {/* Reception */}
            <div className="mb-32">
              <div className="text-center mb-16">
                <Reveal>
                  <div className="text-sm tracking-[0.3em] uppercase text-secondary/55 mb-6 font-light">Reception</div>
                </Reveal>
              </div>
              <div className="grid md:grid-cols-3 gap-12 max-w-3xl mx-auto">
                {[
                  { icon: Calendar, label: 'Date', value: 'October 3, 2026', sub: null, href: null },
                  { icon: Clock, label: 'Time', value: '6:00 PM – 11:00 PM', sub: 'Dinner at 7:00 PM', href: null },
                  { icon: MapPin, label: 'Location', value: 'Longwood Gardens', sub: '1001 Longwood Rd, Kennett Square, PA', href: 'https://maps.google.com/?q=Longwood+Gardens,+1001+Longwood+Road,+Kennett+Square,+PA+19348' },
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
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-primary/30 to-transparent mx-auto my-24" />
            </Reveal>

            {/* Additional info */}
            <div className="grid md:grid-cols-3 gap-16 max-w-4xl mx-auto">
              {[
                { label: 'Dress Code', title: 'Expressive Garden Formal' },
                { label: 'Weather', title: '60–70°F · Outdoor + Indoor' },
                { label: 'Parking', title: 'Complimentary' },
              ].map((card, i) => (
                <Reveal key={card.label} delay={i * 0.12}>
                  <div className="text-center">
                    <div className="text-xs tracking-[0.3em] uppercase text-foreground/55 mb-6 font-light">{card.label}</div>
                    <h3 className="text-xl font-light text-foreground">{card.title}</h3>
                  </div>
                </Reveal>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
