import { motion } from 'motion/react';
import { Reveal } from '../components/Reveal';
import { useLang } from '../context/LanguageContext';

export function Schedule() {
  const { t } = useLang();
  const events = t.scheduleEvents;

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 z-0">
        <img src="/Wedding Cherries Web/IMG_0387.jpg" alt="Garden background" className="w-full h-full object-cover" />
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
                  <h1 className="text-5xl md:text-7xl font-light text-foreground tracking-tight">{t.scheduleTitle}</h1>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Content panel */}
        <div className="max-w-3xl mx-auto px-4 pb-32">
          <div className="bg-white/80 backdrop-blur-xl shadow-2xl shadow-black/8 border border-white/50 p-8 md:p-16 rounded-sm">
            <div className="space-y-10">
              {events.map((event, index) => (
                <Reveal key={index} delay={index * 0.07}>
                  <div className="relative grid grid-cols-[120px,auto,1fr] md:grid-cols-[140px,auto,1fr] gap-6 md:gap-8 items-start group">
                    {/* Time */}
                    <div className="text-right pt-1">
                      <div className="text-base tracking-wider font-light text-primary">{event.time}</div>
                    </div>

                    {/* Dot and line */}
                    <div className="relative flex flex-col items-center">
                      <div className="w-3.5 h-3.5 rounded-full bg-primary/50 border-2 border-white mt-1.5 transition-all duration-300 group-hover:bg-primary group-hover:scale-125 shadow-sm" />
                      {index < events.length - 1 && (
                        <div className="w-px flex-1 bg-gradient-to-b from-primary/40 to-primary/15 mt-2" style={{ minHeight: '2.5rem' }} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="pt-0.5">
                      <h3 className="text-xl md:text-2xl font-light text-foreground mb-1.5 tracking-tight transition-colors duration-300 group-hover:text-primary">
                        {event.title}
                      </h3>
                      <p className="text-base font-light text-foreground/75 leading-relaxed">{event.description}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.2}>
              <div className="mt-24 text-center">
                <p className="text-sm font-light text-foreground/60 italic">
                  {t.scheduleNote}
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  );
}
