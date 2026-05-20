import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="glass max-w-md rounded-3xl p-8 text-center">
        <h1 className="text-4xl font-semibold">404</h1>
        <p className="mt-3 text-white/55">This Nexus route has not been deployed.</p>
        <Link href="/" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-black">Return home</Link>
      </div>
    </main>
  );
}
