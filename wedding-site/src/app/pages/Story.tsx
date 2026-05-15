import { motion } from 'motion/react';
import { Reveal } from '../components/Reveal';
import { useLang } from '../context/LanguageContext';

const photos = [
  ['/Wedding%20Cherries%20Web/IMG_0392.jpg', '/Wedding%20Cherries%20Web/IMG_0394.jpg'],
  ['/Wedding%20Cherries%20Web/IMG_0389.jpg', '/Wedding%20Cherries%20Web/IMG_0398.jpg'],
  ['/Wedding%20Cherries%20Web/IMG_0386.jpg', '/Wedding%20Cherries%20Web/IMG_0401.jpg'],
];
const isPrimary = [true, false, true];

export function Story() {
  const { t } = useLang();
  const events = t.storyEvents.map((e, i) => ({ ...e, photos: photos[i], isPrimary: isPrimary[i] }));
  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 z-0">
        <img src="/Wedding Cherries Web/IMG_0393.jpg" alt="Garden background" className="w-full h-full object-cover" />
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
                  <h1 className="text-5xl md:text-7xl font-light text-foreground tracking-tight">{t.storyTitle}</h1>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Content panel */}
        <div className="max-w-4xl mx-auto px-4 pb-32">
          <div className="bg-white/80 backdrop-blur-xl shadow-2xl shadow-black/8 border border-white/50 p-8 md:p-16 rounded-sm">

            {/* Timeline */}
            <div className="relative">
              {/* Center line - desktop only */}
              <div
                className="hidden md:block absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent"
                style={{ left: '50%', transform: 'translateX(-50%)' }}
              />

              {events.map((event, i) => (
                <div key={event.year} className={i < events.length - 1 ? 'mb-24' : ''}>

                  {/* Year badge */}
                  <Reveal>
                    <div className="flex justify-center mb-10">
                      <div className="relative z-10 flex items-center gap-4">
                        <div className="hidden md:block h-px w-10 bg-primary/20" />
                        <span className="bg-white/90 border border-primary/25 text-foreground/45 text-xs tracking-[0.18em] uppercase font-light px-5 py-2 rounded-sm">
                          {event.year}
                        </span>
                        <div className="hidden md:block h-px w-10 bg-primary/20" />
                      </div>
                    </div>
                  </Reveal>

                  {/* Content grid — alternating sides */}
                  <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">

                    {/* Photos */}
                    <div className={i % 2 === 1 ? 'md:order-2' : ''}>
                      <Reveal direction={i % 2 === 0 ? 'left' : 'right'} delay={0.1}>
                        <div className={`relative ${event.photos.length > 1 ? 'pb-14 pr-14' : ''}`}>
                          <div className="rounded-sm overflow-hidden shadow-xl shadow-black/10">
                            <img
                              src={event.photos[0]}
                              alt={event.title}
                              className="w-full aspect-[3/4] object-cover"
                            />
                          </div>
                          {event.photos[1] && (
                            <div className="absolute bottom-0 right-0 w-[56%] rounded-sm overflow-hidden shadow-2xl ring-4 ring-white">
                              <img
                                src={event.photos[1]}
                                alt={event.title}
                                className="w-full aspect-square object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </Reveal>
                    </div>

                    {/* Text */}
                    <div className={`${i % 2 === 1 ? 'md:order-1' : ''} flex flex-col justify-center py-4 md:py-10`}>
                      <Reveal direction={i % 2 === 0 ? 'right' : 'left'} delay={0.15}>
                        <div
                          className={`h-px w-8 mb-6 ${event.isPrimary ? 'bg-primary/40' : 'bg-secondary/60'}`}
                        />
                        <h2 className="text-3xl md:text-4xl font-light text-foreground mb-6">
                          {event.title}
                        </h2>
                      </Reveal>
                      {event.paragraphs.map((p, j) => (
                        <Reveal key={j} direction={i % 2 === 0 ? 'right' : 'left'} delay={0.25 + j * 0.1}>
                          <p className="text-base font-light text-foreground/75 leading-relaxed mb-4">{p}</p>
                        </Reveal>
                      ))}
                    </div>

                  </div>
                </div>
              ))}
            </div>

            {/* Closing */}
            <Reveal>
              <div className="mt-24 text-center">
                <div className="h-px w-16 bg-gradient-to-r from-transparent via-secondary to-transparent mx-auto mb-10" />
                <div className="flex justify-center mb-8">
                  <span className="bg-white/90 border border-secondary/30 text-foreground/45 text-xs tracking-[0.18em] uppercase font-light px-5 py-2 rounded-sm">
                    October 3, 2026
                  </span>
                </div>
                <p className="text-base font-light text-foreground/75 leading-relaxed max-w-sm mx-auto">
                  {t.storyClosing}
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="h-px w-16 bg-gradient-to-r from-transparent via-secondary to-transparent mx-auto mt-16" />
            </Reveal>

          </div>
        </div>
      </div>
    </div>
  );
}
