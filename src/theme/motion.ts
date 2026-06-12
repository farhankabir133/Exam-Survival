// BPSC Competitive Exam Design Tokens: Motion & Framer Physics

export const motionConfig = {
  type: "spring",
  stiffness: 120,
  damping: 18
};

export const transitionDefaults = {
  duration: 0.35,
  ease: 'easeInOut'
};

export const pageTransitionVariants = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -15 },
  transition: transitionDefaults
};

export const hoverVariants = {
  scaleUp: {
    y: -8,
    scale: 1.01,
    transition: { type: 'spring', stiffness: 100, damping: 15 }
  },
  tap: {
    scale: 0.98
  }
};

export const staggerContainerVariants = {
  animate: {
    transition: {
      staggerChildren: 0.05
    }
  }
};

export const staggerItemVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
};
