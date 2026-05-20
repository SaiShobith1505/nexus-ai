"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { LiveWallpaper } from "@/components/live-wallpaper";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signup } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    try {
      const data = await signup(String(formData.get("name")), String(formData.get("email")), String(formData.get("password")));
      setSession(data.access_token, data.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <LiveWallpaper />
      <Card className="w-full max-w-md">
        <h1 className="text-3xl font-semibold">Create Nexus account</h1>
        <form onSubmit={onSubmit} className="mt-7 space-y-4">
          <Input name="name" placeholder="Your name" required />
          <Input name="email" type="email" placeholder="you@company.com" required />
          <Input name="password" type="password" placeholder="At least 8 characters" required />
          {error && <p className="text-sm text-red-300">{error}</p>}
          <Button className="w-full bg-white text-black hover:bg-cyan">Create account</Button>
        </form>
        <p className="mt-6 text-center text-sm text-white/45">
          Already have access?{" "}
          <Link className="text-cyan" href="/auth/login">
            Login
          </Link>
        </p>
      </Card>
    </main>
  );
}
