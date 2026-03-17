export default function Stats({ totalSaved }) {
  return (
    <section className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between bg-white border border-zinc-200 rounded-3xl p-8 sm:p-12 shadow-sm">
      <div className="space-y-4 max-w-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          PolkaVM Testnet Active
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-zinc-900">
          Save Polka.
        </h1>
        <p className="text-zinc-500 text-lg leading-relaxed">
            SavePolka is a decentralized storage solution. Minimize EVM state bloat using RISC-V Rust compression.
        </p>
      </div>
      
      <div className="w-full md:w-auto bg-zinc-900 rounded-2xl p-8 flex flex-col items-start md:items-end min-w-[260px] text-white shadow-xl shadow-zinc-200">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">Total State Saved</span>
        <div className="flex items-baseline gap-2">
          <span className="text-6xl font-black tracking-tighter italic">
            {totalSaved !== undefined ? totalSaved.toString() : "0"}
          </span>
          <span className="text-zinc-400 font-mono text-sm uppercase">bytes</span>
        </div>
      </div>
    </section>
  );
}