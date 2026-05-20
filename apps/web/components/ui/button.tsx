import * as React from "react";
import { cn } from "@/lib/utils";

export function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:border-cyan/50 hover:bg-cyan/15 hover:shadow-glow active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
