"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function AdminPage() {
  const [users, setUsers] = useState<Array<{ id: string; email: string; name: string; role: string; active: boolean }>>([]);
  const [agents, setAgents] = useState<Array<{ id: string; name: string; published: boolean; rating: number }>>([]);
  useEffect(() => {
    api<typeof users>("/admin/users", {}, { requireAuth: true }).then(setUsers).catch(() => setUsers([]));
    api<typeof agents>("/admin/agents", {}, { requireAuth: true }).then(setAgents).catch(() => setAgents([]));
  }, []);
  return (
    <AppShell>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h1 className="text-2xl font-semibold">Users</h1>
          <div className="mt-5 grid gap-3">
            {users.map((user) => (
              <div key={user.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p>{user.name}</p>
                <p className="text-sm text-white/45">{user.email} · {user.role} · {user.active ? "active" : "banned"}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-2xl font-semibold">Marketplace moderation</h2>
          <div className="mt-5 grid gap-3">
            {agents.map((agent) => (
              <div key={agent.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p>{agent.name}</p>
                <p className="text-sm text-white/45">Rating {Number(agent.rating).toFixed(1)} · {agent.published ? "published" : "draft"}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
