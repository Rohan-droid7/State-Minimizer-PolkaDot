"use client";

import { useState, useEffect,useRef } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt, 
  useAccount 
} from "wagmi";
import { hexToString, decodeEventLog } from "viem";

import Stats from "@/components/Stats";
import Compressor from "@/components/Compressor";
import Decompressor from "@/components/Decompressor";

const CONTRACT_ADDRESS = "0x6a1D99179E05D619bca44a9E5cdb378701263141"; 

const CONTRACT_ABI = [
  {"type":"function","name":"totalBytesSaved","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},
  {"type":"function","name":"storeData","inputs":[{"name":"key","type":"string","internalType":"string"},{"name":"rawData","type":"bytes","internalType":"bytes"}],"outputs":[],"stateMutability":"nonpayable"},
  // Public mapping to view compressed data directly
  // Replace the old userStorage line with this:
{"type":"function","name":"getCompressedData","inputs":[{"name":"user","type":"address","internalType":"address"},{"name":"key","type":"string","internalType":"string"}],"outputs":[{"name":"","type":"bytes","internalType":"bytes"}],"stateMutability":"view"},
  {"type":"function","name":"userStorage","inputs":[{"name":"user","type":"address","internalType":"address"},{"name":"key","type":"string","internalType":"string"}],"outputs":[{"name":"","type":"bytes","internalType":"bytes"}],"stateMutability":"view"},
  {"type":"function","name":"retrieveFullData","inputs":[{"name":"user","type":"address","internalType":"address"},{"name":"key","type":"string","internalType":"string"}],"outputs":[{"name":"","type":"bytes","internalType":"bytes"}],"stateMutability":"nonpayable"},
  {"type":"event","name":"DataDecompressed","inputs":[{"name":"data","type":"bytes","indexed":false}]}
];

export default function Home() {
  const { address } = useAccount();
  
  const [storeKey, setStoreKey] = useState("");
  const [storePayload, setStorePayload] = useState("");
  const [readKey, setReadKey] = useState("");
  const [retrievedData, setRetrievedData] = useState("");
  const [savedKeys, setSavedKeys] = useState([]);

  useEffect(() => {
    const localKeys = localStorage.getItem("savePolkaKeys");
    if (localKeys) setSavedKeys(JSON.parse(localKeys));
  }, []);

  // --- STATS ---
  const { data: totalSaved, refetch: refetchStats } = useReadContract({
    address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'totalBytesSaved',
  });

  // --- VIEW COMPRESSED DATA (FREE READ) ---
  const { data: rawCompressedBytes,refetch: refetchCompressedData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getCompressedData', // <-- Updated!
    args: address && readKey ? [address, readKey] : undefined,

  });

  // --- COMPRESS (WRITE) ---
  const { data: compHash, writeContract: writeCompress, isPending: compPending } = useWriteContract();
  const { isLoading: compConfirming, isSuccess: compConfirmed } = useWaitForTransactionReceipt({ hash: compHash });
  
  const processedTxRef = useRef(null);

  const handleCompress = (finalPayload) => {
    writeCompress({
      address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'storeData', args: [storeKey, finalPayload],
    });
  };

  useEffect(() => {
    if (compConfirmed && compHash && processedTxRef.current !== compHash) {
      
      processedTxRef.current = compHash;

      // 1. Refresh stats
      if (refetchStats) refetchStats();
      
      // 2. Select the file
      setReadKey(storeKey);
      
      // 3. Fetch the new data
      if (refetchCompressedData) refetchCompressedData();

      // 4. Save the key to local history ONCE
      if (storeKey && !savedKeys.includes(storeKey)) {
        const newKeys = [...savedKeys, storeKey];
        setSavedKeys(newKeys);
        localStorage.setItem("savePolkaKeys", JSON.stringify(newKeys));
      }
    }
  }, [compConfirmed, compHash, storeKey, savedKeys, refetchStats, refetchCompressedData]);

  

  const { data: decHash, writeContract: writeDecompress, isPending: decPending } = useWriteContract();
  const { isLoading: decConfirming, isSuccess: decConfirmed, data: decReceipt } = useWaitForTransactionReceipt({ hash: decHash });

  const handleDecompress = () => {
    if (!address) return alert("Please connect your wallet.");
    setRetrievedData("Transaction sent. Waiting for PolkaVM execution..."); 
    writeDecompress({
      address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'retrieveFullData', args: [address, readKey], 
    });
  };

  useEffect(() => {
    if (decConfirmed && decReceipt) {
      let foundData = false;
      for (const log of decReceipt.logs) {
        try {
          const decoded = decodeEventLog({ abi: CONTRACT_ABI, data: log.data, topics: log.topics });
          if (decoded.eventName === 'DataDecompressed') {
            try {
              setRetrievedData(hexToString(decoded.args.data)); 
            } catch {
              setRetrievedData("Data retrieved: " + decoded.args.data);
            }
            foundData = true;
            break;
          }
        } catch (e) { /* ignore other logs */ }
      }
      if (!foundData) setRetrievedData("Error: No event emitted.");
    }
  }, [decConfirmed, decReceipt]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans pb-20 selection:bg-zinc-200">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200 px-6 h-16 flex items-center justify-between">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white font-bold">S</div>
            <span className="font-bold tracking-tight">SAVE POLKA</span>
          </div>
          <ConnectButton />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        <Stats totalSaved={totalSaved} /> 
        
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          <Compressor 
            {...{ storeKey, setStoreKey, storePayload, setStorePayload }}
            hash={compHash} isPending={compPending} isConfirming={compConfirming} isConfirmed={compConfirmed} 
            handleCompress={handleCompress}
          />
          <Decompressor 
            {...{ readKey, setReadKey, retrievedData, savedKeys }} 
            compressedDataHex={rawCompressedBytes} // Feeds the free EVM read to the UI
            onDecompress={handleDecompress}        // Triggers the Rust transaction
            isPending={decPending} isConfirming={decConfirming}
          />
        </div>
      </main>
    </div>
  );
}