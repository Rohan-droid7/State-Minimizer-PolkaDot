import { stringToHex, isHex } from "viem";

export default function Compressor({ 
  storeKey, 
  setStoreKey, 
  storePayload, 
  setStorePayload, 
  isPending, 
  isConfirming, 
  isConfirmed, 
  hash,
  handleCompress 
}) {
  
  const onCompressClick = () => {
    // Auto-convert text to hex for the EVM
    const finalPayload = isHex(storePayload) ? storePayload : stringToHex(storePayload);
    handleCompress(finalPayload);
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm transition-all hover:shadow-md flex flex-col h-full">
      <div className="mb-8">
        <h2 className="text-xl font-semibold tracking-tight mb-1">1. Compress & Store</h2>
        <p className="text-sm text-zinc-500">Enter plain text. We convert it to bytes for Rust.</p>
      </div>
      
      <div className="space-y-5 flex-grow">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">File Name / Key</label>
          <input 
            type="text" 
            value={storeKey}
            onChange={(e) => setStoreKey(e.target.value)}
            placeholder="e.g., User_Profile_01"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Data Payload</label>
          <textarea 
            rows="5"
            value={storePayload}
            onChange={(e) => setStorePayload(e.target.value)}
            placeholder="Paste your text or JSON here..."
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-zinc-900 outline-none transition-all resize-none"
          />
        </div>

        <button 
          onClick={onCompressClick}
          disabled={isPending || isConfirming || !storePayload || !storeKey}
          className="w-full bg-zinc-900 text-white font-bold rounded-xl py-4 hover:bg-zinc-800 disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          {isPending ? "Approve in Wallet..." : isConfirming ? "Compressing on PolkaVM..." : "Compress & Save"}
        </button>

        {isConfirmed && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-mono break-all">
            <span className="font-bold block mb-1">✓ State Minimized & Key Saved</span>
            Tx: {hash}
          </div>
        )}
      </div>
    </div>
  );
}