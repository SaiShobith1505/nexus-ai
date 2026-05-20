/** Shared motion presets — tuned for 60fps, minimal layout thrash */
export const springSnappy = { type: "spring" as const, stiffness: 420, damping: 32, mass: 0.8 };
export const springSoft = { type: "spring" as const, stiffness: 260, damping: 28, mass: 1 };
export const easePremium = [0.22, 1, 0.36, 1] as const;

export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 }
};
