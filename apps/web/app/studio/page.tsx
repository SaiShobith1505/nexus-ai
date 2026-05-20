"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { LucideIcon } from "lucide-react";
import { FlaskConical, Save, UploadCloud, Wrench } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export default function StudioPage() {
  const [status, setStatus] = useState("");
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setStatus("Publishing...");
    try {
      await api(
        "/agents",
        {
          method: "POST",
          body: JSON.stringify({
            name: formData.get("name"),
            slug: String(formData.get("name")).toLowerCase().replaceAll(" ", "-"),
            category: formData.get("category"),
            summary: formData.get("summary"),
            description: formData.get("description"),
            prompt: formData.get("prompt"),
            workflow: { steps: ["intake", "tool-selection", "analysis", "verification", "delivery"] },
            tools: [{ name: "browser" }, { name: "api" }, { name: "files" }],
            pricing_model: "usage",
            price_cents: 9900,
            is_published: true
          })
        },
        { requireAuth: true }
      );
      setStatus("Agent published to marketplace.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not publish agent.");
    }
  }
  const studioFeatures: Array<[LucideIcon, string, string]> = [
    [Wrench, "Tool graph", "Connect APIs, browser automation, file context, CRM, logs, and deployment controls."],
    [UploadCloud, "Knowledge attachments", "Upload policies, runbooks, repos, PDFs, and domain-specific evaluation sets."],
    [FlaskConical, "Live test harness", "Run sandbox executions, inspect reasoning steps, compare outputs, and promote versions."]
  ];

  return (
    <AppShell>
      <div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
        <Card>
          <p className="text-sm text-cyan">Builder Studio</p>
          <h1 className="mt-2 text-4xl font-semibold">Design an autonomous worker</h1>
          <form onSubmit={onSubmit} className="mt-7 grid gap-4">
            <Input name="name" placeholder="Agent name" required />
            <Input name="category" placeholder="category, e.g. qa-testing" required />
            <Input name="summary" placeholder="One-line marketplace summary" required />
            <textarea name="description" className="min-h-28 rounded-3xl border border-white/12 bg-white/[0.06] p-4 text-sm outline-none focus:border-cyan/60" placeholder="Agent description" required />
            <textarea name="prompt" className="min-h-36 rounded-3xl border border-white/12 bg-white/[0.06] p-4 text-sm outline-none focus:border-cyan/60" placeholder="System prompt and operating policy" required />
            <Button className="bg-white text-black hover:bg-cyan"><Save size={16} /> Publish agent</Button>
            {status && <p className="text-sm text-white/60">{status}</p>}
          </form>
        </Card>
        <div className="grid gap-4">
          {studioFeatures.map(([Icon, title, body]) => (
            <Card key={title} className="flex items-start gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-cyan/15 text-cyan"><Icon size={19} /></span>
              <div>
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="mt-2 leading-7 text-white/55">{body}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
