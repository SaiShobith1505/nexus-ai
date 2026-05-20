"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, CreditCard, Rocket, TerminalSquare, X } from "lucide-react";
import { LiveDot } from "@/components/operational/live-dot";
import type { Notification } from "@/lib/api";
import { cn } from "@/lib/utils";

const KIND_ICONS: Record<string, typeof Bell> = {
  execution: TerminalSquare,
  billing: CreditCard,
  deployment: Rocket
};

function iconFor(kind: string) {
  const prefix = kind.split(".")[0];
  return KIND_ICONS[prefix] ?? Bell;
}

type Props = {
  open: boolean;
  onClose: () => void;
  grouped: Record<string, Notification[]>;
  connected: boolean;
  unread: number;
};

export function NotificationDrawer({ open, onClose, grouped, connected, unread }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="glass fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-white/10 shadow-violet"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-cyan">Alerts</p>
                <h2 className="text-lg font-semibold">Operational notifications</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 text-xs text-white/45">
                  <LiveDot active={connected} />
                  {connected ? "Realtime" : "Reconnecting"}
                </span>
                {unread > 0 && (
                  <span className="rounded-full bg-cyan/20 px-2 py-0.5 text-xs text-cyan">{unread}</span>
                )}
                <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 hover:bg-white/10" aria-label="Close">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {Object.keys(grouped).length === 0 && (
                <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/45">No notifications yet. Executions and deployments will appear here.</p>
              )}
              {Object.entries(grouped).map(([group, items]) => {
                const Icon = iconFor(group);
                return (
                  <div key={group} className="mb-6">
                    <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/40">
                      <Icon size={14} className="text-cyan" />
                      {group}
                    </p>
                    <div className="grid gap-2">
                      {items.map((item) => (
                        <motion.article
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "rounded-2xl border p-4 transition",
                            item.read_at ? "border-white/8 bg-white/[0.02]" : "border-cyan/25 bg-cyan/5 shadow-glow"
                          )}
                        >
                          <p className="font-medium">{item.title}</p>
                          <p className="mt-1 text-sm leading-6 text-white/55">{item.body}</p>
                          <p className="mt-2 text-[10px] text-white/35">{new Date(item.created_at).toLocaleString()}</p>
                        </motion.article>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
