"use client";

import { useEffect } from "react";

export function CursorAura() {
  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      document.body.style.setProperty("--mouse-x", `${event.clientX}px`);
      document.body.style.setProperty("--mouse-y", `${event.clientY}px`);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return null;
}
