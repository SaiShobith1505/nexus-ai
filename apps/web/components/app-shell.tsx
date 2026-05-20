"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Bot, CreditCard, LayoutDashboard, Shield, Sparkles, TerminalSquare, Workflow } from "lucide-react";
import { LiveWallpaper } from "@/components/live-wallpaper";
import { NotificationDrawer } from "@/components/notification-drawer";
import { LiveDot } from "@/components/operational/live-dot";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

const items = [
  ["/dashboard", LayoutDashboard, "Dashboard"],
  ["/marketplace", Bot, "Marketplace"],
  ["/studio", Workflow, "Studio"],
  ["/playground", TerminalSquare, "Playground"],
  ["/admin", Shield, "Admin"],
  ["/billing", CreditCard, "Billing"]
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { grouped, open, setOpen, connected, unread } = useNotifications();

  return (
    <main className="min-h-screen">
      <LiveWallpaper />
      <aside className="fixed left-4 top-4 z-40 hidden h-[calc(100vh-2rem)] w-64 flex-col rounded-3xl border border-white/10 bg-black/25 p-4 backdrop-blur-2xl lg:flex">
        <Link href="/" className="mb-8 flex items-center gap-2 px-2 text-lg font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-cyan/15 text-cyan shadow-glow">
            <Sparkles size={17} />
          </span>
          Nexus AI
        </Link>
        <nav className="grid flex-1 gap-2">
          {items.map(([href, Icon, label]) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition",
                  active ? "border border-cyan/25 bg-cyan/10 text-white shadow-glow" : "text-white/62 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon size={17} className={active ? "text-cyan" : undefined} />
                {label}
                {href === "/playground" && active && <LiveDot className="ml-auto" />}
              </Link>
            );
          })}
        </nav>
        <p className="mt-4 flex items-center gap-2 px-2 text-[10px] text-white/35">
          <LiveDot active={connected} />
          Control plane {connected ? "synced" : "connecting"}
        </p>
      </aside>

      <section className="px-4 py-4 lg:ml-72">
        <header className="glass mb-4 flex h-16 items-center justify-between rounded-3xl px-5 edge-glow">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan">Control plane</p>
            <p className="text-sm text-white/55">Autonomous workforce operations</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-cyan/40 hover:bg-cyan/10 hover:text-white"
            title="Notifications"
          >
            <Bell size={17} />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan px-1 text-[10px] font-bold text-black">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
        </header>
        {children}
      </section>

      <NotificationDrawer open={open} onClose={() => setOpen(false)} grouped={grouped} connected={connected} unread={unread} />

      <nav className="fixed bottom-4 left-4 right-4 z-40 flex justify-around rounded-2xl border border-white/10 bg-black/60 p-2 backdrop-blur-xl lg:hidden">
        {items.slice(0, 5).map(([href, Icon]) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "grid h-10 w-10 place-items-center rounded-xl",
              pathname === href ? "bg-cyan/15 text-cyan" : "text-white/50"
            )}
            aria-label={href}
          >
            <Icon size={18} />
          </Link>
        ))}
      </nav>
    </main>
  );
}
