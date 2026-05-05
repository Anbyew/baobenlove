import { motion } from 'motion/react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Reveal } from '../components/Reveal';

export function Details() {
  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 z-0">
        <img src="/backgrounds/bg2.jpg" alt="Garden background" className="w-full h-full object-cover" />
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
              <motion.p
                className="text-xl font-light text-foreground/70"
                initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.9, delay: 0.6 }}
              >
                Everything you need to know
              </motion.p>
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
                  <div className="text-xs tracking-[0.3em] uppercase text-primary/55 mb-6 font-light">Ceremony</div>
                </Reveal>
                <Reveal delay={0.1}>
                  <h2 className="text-3xl md:text-4xl font-light text-foreground mb-12">Join us as we exchange our vows</h2>
                </Reveal>
              </div>
              <div className="grid md:grid-cols-3 gap-12 max-w-3xl mx-auto">
                {[
                  { icon: Calendar, label: 'Date', value: 'October 3, 2026', sub: null },
                  { icon: Clock, label: 'Time', value: '4:30 PM', sub: 'Arrive by 4:15 PM' },
                  { icon: MapPin, label: 'Location', value: 'Longwood Gardens', sub: 'Open Air Theatre' },
                ].map((item, i) => (
                  <Reveal key={item.label} delay={i * 0.12} direction="up">
                    <div className="text-center group">
                      <item.icon className="w-7 h-7 text-primary/35 mx-auto mb-4 transition-all duration-300 group-hover:text-primary/60 group-hover:scale-110" />
                      <div className="text-xs tracking-wider uppercase text-foreground/55 mb-3 font-light">{item.label}</div>
                      <div className="text-lg font-light text-foreground">{item.value}</div>
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
                  <div className="text-xs tracking-[0.3em] uppercase text-secondary/55 mb-6 font-light">Reception</div>
                </Reveal>
                <Reveal delay={0.1}>
                  <h2 className="text-3xl md:text-4xl font-light text-foreground mb-12">Dinner, drinks, and dancing to follow</h2>
                </Reveal>
              </div>
              <div className="grid md:grid-cols-3 gap-12 max-w-3xl mx-auto">
                {[
                  { icon: Calendar, label: 'Date', value: 'October 3, 2026', sub: null },
                  { icon: Clock, label: 'Time', value: '6:00 PM – 11:00 PM', sub: 'Cocktail hour at 6:00 PM' },
                  { icon: MapPin, label: 'Location', value: 'Longwood Gardens', sub: 'Terrace Restaurant' },
                ].map((item, i) => (
                  <Reveal key={item.label} delay={i * 0.12} direction="up">
                    <div className="text-center group">
                      <item.icon className="w-7 h-7 text-secondary/35 mx-auto mb-4 transition-all duration-300 group-hover:text-secondary/60 group-hover:scale-110" />
                      <div className="text-xs tracking-wider uppercase text-foreground/55 mb-3 font-light">{item.label}</div>
                      <div className="text-lg font-light text-foreground">{item.value}</div>
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
                {
                  label: 'Dress Code',
                  title: 'Formal Garden Attire',
                  body: 'Please wear formal attire in garden-appropriate colors. Ladies may prefer block heels or wedges for the outdoor ceremony.',
                },
                {
                  label: 'Weather',
                  title: 'October in Pennsylvania',
                  body: 'Expect pleasant fall weather around 60–70°F. We recommend bringing a light jacket for the evening.',
                },
                {
                  label: 'Parking',
                  title: 'Complimentary',
                  body: 'Free parking is available at Longwood Gardens. Valet service will be provided at the main entrance.',
                },
              ].map((card, i) => (
                <Reveal key={card.label} delay={i * 0.12}>
                  <div className="text-center">
                    <div className="text-xs tracking-[0.3em] uppercase text-foreground/55 mb-6 font-light">{card.label}</div>
                    <h3 className="text-xl font-light text-foreground mb-4">{card.title}</h3>
                    <p className="text-sm font-light text-foreground/75 leading-relaxed">{card.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Address */}
            <Reveal delay={0.2}>
              <div className="text-center mt-24">
                <div className="text-sm font-light text-foreground/65 space-y-1">
                  <p>1001 Longwood Road</p>
                  <p>Kennett Square, Pennsylvania 19348</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  );
}
