export default function Decompressor({ 
  readKey, 
  setReadKey, 
  savedKeys,
  compressedDataHex, // The raw hex from the EVM view call
  retrievedData,     // The final text from the Rust transaction
  onDecompress,
  isPending,
  isConfirming
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm flex flex-col h-full">
      <div className="mb-8">
        <h2 className="text-xl font-semibold tracking-tight mb-1">2. Retrieve & Inflate</h2>
        <p className="text-sm text-zinc-500">View compressed EVM state, then execute Rust decompression.</p>
      </div>
      
      <div className="space-y-5 flex-grow">
        {/* Saved Keys Quick-Select */}
        {savedKeys.length > 0 && (
          <div className="space-y-2 pb-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Saved Keys</label>
            <div className="flex flex-wrap gap-2">
              {savedKeys.map((key) => (
                <button
                  key={key}
                  onClick={() => setReadKey(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                    readKey === key ? "bg-zinc-900 text-white border-zinc-900" : "bg-zinc-50 text-zinc-600 border-zinc-200"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Key Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Lookup Key</label>
          <input 
            type="text" 
            value={readKey}
            onChange={(e) => setReadKey(e.target.value)}
            placeholder="Enter key..."
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-zinc-900 outline-none"
          />
        </div>

        {/* STEP 1: View Compressed Data from EVM */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Step 1: Raw EVM State (Compressed)</label>
          <div className="w-full bg-zinc-100 border border-zinc-200 rounded-xl px-4 py-3 min-h-[60px] text-xs font-mono text-zinc-500 break-all overflow-y-auto">
            {compressedDataHex && compressedDataHex !== "0x" ? compressedDataHex : "No compressed data found for this key."}
          </div>
        </div>

        {/* STEP 2: Execute Rust Decompression */}
        <button 
          onClick={onDecompress}
          disabled={isPending || isConfirming || !readKey || !compressedDataHex || compressedDataHex === "0x"}
          className="w-full bg-zinc-900 text-white font-bold rounded-xl py-4 hover:bg-zinc-800 disabled:opacity-50 active:scale-[0.98] transition-all mt-4"
        >
          {isPending ? "Sign in Wallet..." : isConfirming ? "Rust VM Executing..." : "Step 2: Decompress via Rust"}
        </button>

        {/* Result: Decompressed Text */}
        <div className="space-y-2 pt-4">
          <label className="text-xs font-bold uppercase tracking-widest text-emerald-600">Final Inflated Text</label>
          <div className="w-full bg-zinc-50 border border-emerald-200 rounded-xl px-4 py-3 min-h-[100px] text-sm font-mono text-zinc-800 whitespace-pre-wrap break-words overflow-y-auto shadow-sm">
            {retrievedData ? retrievedData : "Waiting for Rust transaction..."}
          </div>
        </div>
      </div>
    </div>
  );
}