export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center">
      <div className="glass rounded-3xl p-8 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
        <p className="mt-5 text-sm text-white/55">Synchronizing Nexus fabric...</p>
      </div>
    </main>
  );
}
