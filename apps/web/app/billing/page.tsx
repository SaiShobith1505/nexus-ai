"use client";

import { CreditCard, Percent, ReceiptText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function BillingPage() {
  const billingFeatures: Array<[LucideIcon, string, string]> = [
    [CreditCard, "Subscriptions", "Seat-based and agent-based recurring plans."],
    [ReceiptText, "Usage billing", "Token, execution, and deployment metering."],
    [Percent, "Commissions", "Marketplace revenue split and payout analytics."]
  ];

  async function checkout() {
    const result = await api<{ checkout_url?: string; message?: string }>(
      "/billing/checkout",
      { method: "POST", body: "{}" },
      { requireAuth: true }
    );
    if (result.checkout_url) window.location.href = result.checkout_url;
    else alert(result.message);
  }
  return (
    <AppShell>
      <div className="grid gap-4 md:grid-cols-3">
        {billingFeatures.map(([Icon, title, body]) => (
          <Card key={title}>
            <Icon className="text-cyan" />
            <h1 className="mt-5 text-xl font-semibold">{title}</h1>
            <p className="mt-3 leading-7 text-white/55">{body}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-4">
        <h2 className="text-3xl font-semibold">Upgrade marketplace operations</h2>
        <p className="mt-3 max-w-2xl leading-7 text-white/55">Connect Stripe to enable subscription checkout, usage billing, invoices, and commission reporting.</p>
        <Button onClick={checkout} className="mt-6 bg-white text-black hover:bg-cyan">Start checkout</Button>
      </Card>
    </AppShell>
  );
}
