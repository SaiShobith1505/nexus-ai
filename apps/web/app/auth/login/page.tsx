"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { Suspense, useState } from "react";
import { Github } from "lucide-react";
import { LiveWallpaper } from "@/components/live-wallpaper";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/api";
import { AUTH_RETURN_KEY } from "@/lib/auth/constants";
import { loadPendingPlayground } from "@/lib/auth/playground-pending";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession, consumeReturnPath } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const returnParam = searchParams.get("return");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setLoading(true);
    setError("");
    try {
      const data = await login(String(formData.get("email")), String(formData.get("password")));
      setSession(data.access_token, data.user);
      const pending = loadPendingPlayground();
      const returnPath = returnParam ?? consumeReturnPath() ?? (pending ? "/playground" : "/dashboard");
      if (returnPath) sessionStorage.setItem(AUTH_RETURN_KEY, returnPath);
      router.push(returnPath.startsWith("/") ? returnPath : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <h1 className="text-3xl font-semibold">Welcome back</h1>
      <p className="mt-2 text-sm text-white/55">Sign in to deploy and operate your AI workforce.</p>
      {returnParam && (
        <p className="mt-3 rounded-xl border border-cyan/20 bg-cyan/10 px-3 py-2 text-xs text-cyan">
          You will return to {returnParam} after sign-in.
        </p>
      )}
      <form onSubmit={onSubmit} className="mt-7 space-y-4">
        <Input name="email" type="email" placeholder="founder@nexus.ai" required />
        <Input name="password" type="password" placeholder="NexusAI!2026" required />
        {error && <p className="text-sm text-red-300">{error}</p>}
        <Button className="w-full bg-white text-black hover:bg-cyan" disabled={loading}>
          {loading ? "Authenticating..." : "Login"}
        </Button>
      </form>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link href={`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/oauth/google/start`} className="rounded-full border border-white/10 px-4 py-2 text-center text-sm text-white/65">
          Google
        </Link>
        <Link
          href={`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/oauth/github/start`}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/65"
        >
          <Github size={15} />
          GitHub
        </Link>
      </div>
      <p className="mt-6 text-center text-sm text-white/45">
        New here?{" "}
        <Link className="text-cyan" href="/auth/signup">
          Create account
        </Link>
      </p>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <LiveWallpaper />
      <Suspense fallback={<div className="h-64 w-full max-w-md animate-pulse rounded-2xl bg-white/5" />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
