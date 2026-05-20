"use client";

import { Suspense } from "react";
import { PlaygroundConsole } from "@/components/playground/playground-console";

function PlaygroundFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-10 w-10 animate-pulse rounded-full border border-cyan/30 border-t-cyan" />
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <Suspense fallback={<PlaygroundFallback />}>
      <PlaygroundConsole />
    </Suspense>
  );
}
