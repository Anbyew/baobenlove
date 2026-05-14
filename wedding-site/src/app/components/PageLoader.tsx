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
          className="fixed inset-0 z-[9999] flex items-center justify-center select-none"
          style={{ background: 'linear-gradient(135deg, #f4efea 0%, #ede7e1 50%, #eae4dc 100%)' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.img
            src="/AI/seal.png"
            alt=""
            className="w-48 md:w-56"
            initial={{ opacity: 0, scale: 0.88, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
