'use client';

import { ReactNode, HTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  variant?: 'light' | 'dark' | 'primary';
  interactive?: boolean;
}

export function GlassCard({ children, className, variant = 'light', interactive = true, ...props }: GlassCardProps) {
  const variants = {
    light: 'bg-white/10 dark:bg-black/20 border-white/20 dark:border-white/10',
    dark: 'bg-black/40 border-white/10',
    primary: 'bg-primary/5 border-primary/20',
  };

  return (
    <motion.div
      {...props}
      whileHover={interactive ? { y: -5, scale: 1.02, transition: { duration: 0.2 } } : {}}
      className={cn(
        "relative overflow-hidden rounded-3xl border backdrop-blur-xl shadow-2xl transition-all duration-300",
        variants[variant],
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
