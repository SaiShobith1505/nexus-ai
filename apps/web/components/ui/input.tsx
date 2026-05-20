import * as React from "react";
import { cn } from "@/lib/utils";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-11 w-full rounded-full border border-white/12 bg-white/[0.06] px-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-cyan/60 focus:ring-4 focus:ring-cyan/10",
        props.className
      )}
    />
  );
}
