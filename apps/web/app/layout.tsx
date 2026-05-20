import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { CursorAura } from "@/components/cursor-aura";
import { AuthProvider } from "@/components/providers/auth-provider";

export const metadata: Metadata = {
  title: "Nexus AI | Enterprise AI Workforce Marketplace",
  description: "Browse, deploy, publish, and operate autonomous enterprise AI agents."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="noise antialiased">
        <AuthProvider>
          <CursorAura />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
