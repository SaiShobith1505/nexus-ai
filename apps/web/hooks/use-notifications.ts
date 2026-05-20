"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/auth/api-client";
import { hasAuthToken } from "@/lib/auth/token";
import { getNotificationsWsUrl } from "@/lib/api";
import type { Notification } from "@/lib/api-types";

export function useNotifications() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const refresh = useCallback(async () => {
    if (!hasAuthToken()) return;
    try {
      const list = await apiRequest<Notification[]>("/notifications", { requireAuth: true });
      setItems(list);
    } catch {
      /* unauthenticated or offline */
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const url = getNotificationsWsUrl();
    if (!url) return;

    const connect = () => {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        window.setTimeout(connect, 4000);
      };
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as Omit<Notification, "read_at" | "created_at"> & {
            created_at?: string;
          };
          const incoming: Notification = {
            id: payload.id,
            kind: payload.kind,
            title: payload.title,
            body: payload.body,
            data: payload.data ?? {},
            read_at: null,
            created_at: payload.created_at ?? new Date().toISOString()
          };
          setItems((prev) => [incoming, ...prev.filter((n) => n.id !== incoming.id)].slice(0, 50));
        } catch {
          /* ignore malformed */
        }
      };
      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  const unread = items.filter((n) => !n.read_at).length;

  const grouped = items.reduce<Record<string, Notification[]>>((acc, item) => {
    const key = item.kind.split(".")[0] || "system";
    acc[key] = acc[key] ? [...acc[key], item] : [item];
    return acc;
  }, {});

  return { items, grouped, unread, open, setOpen, connected, refresh };
}
