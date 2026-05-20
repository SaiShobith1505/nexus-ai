import Link from "next/link";
import { LayoutDashboard, Sparkles } from "lucide-react";

export function Nav() {
  return (
    <header className="fixed left-0 right-0 top-4 z-50 mx-auto max-w-6xl px-4">
      <nav className="glass flex h-14 items-center justify-between rounded-full px-4">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-wide">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-cyan/15 text-cyan shadow-glow">
            <Sparkles size={16} />
          </span>
          Nexus AI
        </Link>
        <div className="hidden items-center gap-6 text-sm text-white/65 md:flex">
          <Link href="/marketplace" className="transition hover:text-white">Marketplace</Link>
          <Link href="/studio" className="transition hover:text-white">Studio</Link>
          <Link href="/playground" className="transition hover:text-white">Playground</Link>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/auth/login" className="hidden rounded-full px-4 py-2 text-sm text-white/70 transition hover:text-white sm:block">Login</Link>
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-cyan">
            <LayoutDashboard size={15} />
            Launch
          </Link>
        </div>
      </nav>
    </header>
  );
}
