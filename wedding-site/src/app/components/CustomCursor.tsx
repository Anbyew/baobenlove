import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

export function CustomCursor() {
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [isTouch, setIsTouch] = useState(true);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Faster springs — higher stiffness, lower damping
  const dotX = useSpring(mouseX, { damping: 28, stiffness: 700 });
  const dotY = useSpring(mouseY, { damping: 28, stiffness: 700 });
  const ringX = useSpring(mouseX, { damping: 20, stiffness: 300 });
  const ringY = useSpring(mouseY, { damping: 20, stiffness: 300 });

  useEffect(() => {
    setIsTouch(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  useEffect(() => {
    if (isTouch) return;

    document.documentElement.classList.add('custom-cursor');

    const handleMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!visible) setVisible(true);
      const el = e.target as Element;
      setHovering(!!el.closest('a, button, [role="button"]'));
    };

    window.addEventListener('mousemove', handleMove);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      document.documentElement.classList.remove('custom-cursor');
    };
  }, [isTouch]);

  if (isTouch) return null;

  return (
    <>
      {/* Inner diamond — snappy, follows closely */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998]"
        style={{ x: dotX, y: dotY }}
      >
        {/* Static wrapper: center + rotate 45° */}
        <div style={{ transform: 'translate(-50%, -50%) rotate(45deg)' }}>
          <motion.div
            animate={{
              width: hovering ? 16 : 11,
              height: hovering ? 16 : 11,
              opacity: visible ? 1 : 0,
              backgroundColor: hovering ? 'rgba(26,122,156,0.18)' : 'rgba(26,122,156,0.12)',
              borderColor: 'rgba(26,122,156,1)',
            }}
            style={{ border: '1.5px solid rgba(26,122,156,1)' }}
            transition={{ duration: 0.15 }}
          />
        </div>
      </motion.div>

      {/* Outer diamond ring — trails behind */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9997]"
        style={{ x: ringX, y: ringY }}
      >
        <div style={{ transform: 'translate(-50%, -50%) rotate(45deg)' }}>
          <motion.div
            animate={{
              width: hovering ? 52 : 36,
              height: hovering ? 52 : 36,
              opacity: visible ? 1 : 0,
              borderColor: hovering ? 'rgba(26,122,156,0.55)' : 'rgba(26,122,156,0.38)',
            }}
            style={{ border: '1px solid rgba(26,122,156,0.38)' }}
            transition={{ duration: 0.22 }}
          />
        </div>
      </motion.div>
    </>
  );
}
