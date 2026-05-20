"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bot, Boxes, ShieldCheck, Zap } from "lucide-react";
import { LiveWallpaper } from "@/components/live-wallpaper";
import { LiveDot } from "@/components/operational/live-dot";
import { Nav } from "@/components/nav";
import { Card } from "@/components/ui/card";
import { fadeUp } from "@/lib/motion";

const agents = ["QA Testing", "DevOps Monitoring", "Repository Intel", "Compliance Audit", "Sales Intelligence", "RFP Proposal"];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <LiveWallpaper />
      <Nav />
      <section className="flex min-h-screen items-center px-4 pt-24">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <motion.div {...fadeUp} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-cyan shadow-glow">
              <LiveDot />
              <Zap size={15} />
              Enterprise autonomous workforce OS
            </motion.div>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-normal md:text-7xl">
              Hire, deploy, and govern <span className="premium-gradient animate-shimmer">autonomous AI agents</span>.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/62">
              Nexus AI brings OpenAI-grade orchestration, marketplace monetization, deployment telemetry, and enterprise controls into one cinematic operating layer.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/playground" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:bg-cyan hover:shadow-glow">
                Open execution center <ArrowRight size={16} />
              </Link>
              <Link href="/marketplace" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 text-sm font-semibold text-white transition hover:border-cyan/50 hover:bg-cyan/10">
                Explore marketplace
              </Link>
              <Link href="/studio" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 text-sm font-semibold text-white transition hover:border-violet/70 hover:bg-violet/15">
                Build an agent <Bot size={16} />
              </Link>
            </div>
          </div>
          <Card className="relative min-h-[34rem] overflow-hidden rounded-[2rem] p-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(94,231,255,.22),transparent_30%),radial-gradient(circle_at_80%_60%,rgba(157,124,255,.25),transparent_30%)]" />
            <div className="relative p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-sm text-white/45">Live execution fabric</p>
                  <h2 className="text-2xl font-semibold">Nexus Orchestrator</h2>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald/15 px-3 py-1 text-xs text-emerald">
                  <LiveDot /> Online
                </span>
              </div>
              <div className="mt-6 grid gap-3">
                {agents.map((agent, index) => (
                  <div key={agent} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-cyan">
                        {index % 2 ? <Boxes size={18} /> : <ShieldCheck size={18} />}
                      </span>
                      <div>
                        <p className="font-medium">{agent}</p>
                        <p className="text-xs text-white/45">Autonomous workflow ready</p>
                      </div>
                    </div>
                    <span className="text-sm text-white/50">{94 + index}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-24 md:grid-cols-3">
        {[
          ["Marketplace", "Search, compare, subscribe, and deploy verified AI workers."],
          ["Builder Studio", "Prompts, tools, workflow graphs, file context, and live tests."],
          ["Control Plane", "RBAC, billing, analytics, logs, alerts, and compliance telemetry."]
        ].map(([title, body]) => (
          <Card key={title} className="transition hover:-translate-y-1 hover:border-cyan/30">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-3 leading-7 text-white/55">{body}</p>
          </Card>
        ))}
      </section>
    </main>
  );
}
