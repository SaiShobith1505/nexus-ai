"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/auth/api-client";
import type { DashboardSummary } from "@/lib/api-types";
import { hasAuthToken } from "@/lib/auth/token";

const EMPTY: DashboardSummary = { agents: 0, executions: 0, tokens: 0, revenue_cents: 0, activity: [] };

export function useLiveMetrics(intervalMs = 12000) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = () => {
      if (!hasAuthToken()) {
        if (mounted) setSummary(EMPTY);
        return;
      }
      apiRequest<DashboardSummary>("/dashboard/summary", { requireAuth: true })
        .then((data) => {
          if (mounted) {
            setSummary(data);
            setPulse((p) => p + 1);
          }
        })
        .catch(() => mounted && setSummary(EMPTY));
    };

    load();
    const id = window.setInterval(load, intervalMs);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [intervalMs]);

  return { summary: summary ?? EMPTY, pulse, loading: summary === null };
}
