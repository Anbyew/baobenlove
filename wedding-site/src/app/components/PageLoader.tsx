import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function PageLoader() {
  const [visible, setVisible] = useState(() => !sessionStorage.getItem('loader-shown'));

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem('loader-shown', '1');
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center select-none"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="h-px w-14 bg-gradient-to-r from-transparent via-primary to-transparent mb-10"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.1 }}
          />
          <motion.p
            className="text-5xl font-light text-foreground tracking-tight"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            initial={{ opacity: 0, y: 18, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            Yuwei &amp; Benjamin
          </motion.p>
          <motion.p
            className="mt-5 text-[10px] tracking-[0.4em] uppercase text-primary/50 font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.15 }}
          >
            Optimum attingitur
          </motion.p>
          <motion.div
            className="h-px w-14 bg-gradient-to-r from-transparent via-secondary to-transparent mt-10"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.5 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
