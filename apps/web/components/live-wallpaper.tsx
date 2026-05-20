"use client";

import { motion, useReducedMotion } from "framer-motion";
import { memo } from "react";

const PARTICLE_COUNT = 28;

export const LiveWallpaper = memo(function LiveWallpaper() {
  const reduce = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="aurora-mesh absolute inset-0 opacity-80" />
      <motion.div
        className="absolute left-1/2 top-[-22%] h-[46rem] w-[46rem] -translate-x-1/2 rounded-full bg-cyan/18 blur-3xl"
        animate={reduce ? undefined : { x: [0, 60, -30, 0], y: [0, 30, -15, 0], scale: [1, 1.06, 0.97, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-20%] right-[-8%] h-[40rem] w-[40rem] rounded-full bg-violet/22 blur-3xl"
        animate={reduce ? undefined : { x: [0, -50, 25, 0], y: [0, -40, 15, 0], scale: [1, 0.94, 1.04, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      {!reduce &&
        Array.from({ length: PARTICLE_COUNT }).map((_, index) => (
          <motion.span
            key={index}
            className="absolute h-1 w-1 rounded-full bg-white/40"
            style={{ left: `${(index * 37) % 100}%`, top: `${(index * 53) % 100}%` }}
            animate={{ opacity: [0.1, 0.55, 0.1], y: [0, -12 - (index % 4) * 4, 0] }}
            transition={{ duration: 5 + (index % 4), repeat: Infinity, delay: index * 0.14 }}
          />
        ))}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#03040a_88%)]" />
    </div>
  );
});
