import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useLang } from '../context/LanguageContext';

export function Home() {
  const { t } = useLang();
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '28%']);

  return (
    <div ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
      {/* Parallax Background */}
      <motion.div className="absolute inset-0 scale-[1.15]" style={{ y: backgroundY }}>
        <img
          src="/backgrounds/bg1.jpg"
          alt="Garden background"
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-white/52" />

      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 -right-24 w-96 h-96 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 py-32 max-w-6xl w-full">
        {/* Top rule */}
        <motion.div
          className="h-px w-12 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-16"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Names — text-reveal clip from bottom */}
        <div className="mb-8 space-y-4">
          <div className="overflow-hidden">
            <motion.div
              initial={{ y: '110%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 1.1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-light text-foreground tracking-tight">
                {t.name1}
              </h1>
            </motion.div>
          </div>

          <motion.div
            className="text-2xl md:text-3xl text-secondary/70 font-light"
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            &amp;
          </motion.div>

          <div className="overflow-hidden">
            <motion.div
              initial={{ y: '110%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 1.1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-light text-foreground tracking-tight">
                {t.name2}
              </h1>
            </motion.div>
          </div>
        </div>

        {/* Latin phrase */}
        <motion.div
          className="my-14"
          initial={{ opacity: 0, filter: 'blur(10px)', y: 14 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{ duration: 1.2, delay: 0.95, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xl md:text-2xl lg:text-3xl tracking-wide italic text-white-gold" style={{ fontFamily: 'var(--font-heading)' }}>
            {t.latinPhrase}
          </p>
        </motion.div>

        {/* Date & location */}
        <motion.div
          className="space-y-5 my-16"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-2xl md:text-3xl font-light text-foreground tracking-widest">
            {t.date}
          </div>
          <div className="h-px w-8 bg-primary/25 mx-auto" />
          <div className="text-lg md:text-xl font-light text-foreground/85">
            {t.venue}
          </div>
          <div className="text-base md:text-lg font-light text-foreground/65">
            {t.location}
          </div>
        </motion.div>

        {/* Bottom rule */}
        <motion.div
          className="h-px w-12 bg-gradient-to-r from-transparent via-secondary to-transparent mx-auto mt-16"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 1.35, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 1.9 }}
      >
        <motion.div
          className="w-px h-14 bg-gradient-to-b from-foreground/25 to-transparent mx-auto"
          animate={{ scaleY: [1, 0.5, 1], opacity: [0.3, 0.65, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </div>
  );
}
