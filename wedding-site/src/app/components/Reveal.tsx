import { motion, useInView } from 'motion/react';
import { useRef, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'left' | 'right' | 'none';
  className?: string;
  duration?: number;
}

export function Reveal({ children, delay = 0, direction = 'up', className, duration = 0.85 }: Props) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  const hidden = {
    opacity: 0,
    filter: 'blur(5px)',
    y: direction === 'up' ? 36 : 0,
    x: direction === 'left' ? -36 : direction === 'right' ? 36 : 0,
  };

  const visible = { opacity: 1, filter: 'blur(0px)', y: 0, x: 0 };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={hidden}
      animate={isInView ? visible : hidden}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
