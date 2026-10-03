import React from 'react';

export default function Badge({ status, text, size = "md" }) {
  const label = text || status;
  const s = (status || "").toUpperCase();

  // Vibrant Neobrutalist colors (EXCLUDING purple and blue)
  let bgClass = "bg-white text-black";

  // Green / Safe / In Stock / Online (Vivid Lime / Mint)
  if (['IN STOCK', 'NORMAL', 'SAFE', 'ASSIGNED', 'COMPLETED', 'CONFIRMED', 'ONLINE', 'PROCESSED', 'READY', 'MODEL TRAINED'].includes(s)) {
    bgClass = "bg-[#86efac] text-black";
  }
  // Yellow / Amber / Warning (Electric Yellow / Gold)
  else if (['LOW STOCK', 'WARNING', 'EXPIRING SOON', 'PENDING_REVIEW', 'PENDING', 'DEMO_MODE', 'INSUFFICIENT DATA'].includes(s)) {
    bgClass = "bg-[#fde047] text-black";
  }
  // Red / Critical / Expired (Hot Coral / Punch Red)
  else if (['EXPIRED', 'CRITICAL', 'OUT OF STOCK', 'SOLD', 'FAILED', 'ERROR'].includes(s)) {
    bgClass = "bg-[#f87171] text-black";
  }
  // Info / Restock / Available / System (Tangerine / Orange / Cream)
  else if (['INFO', 'RESTOCK', 'ADJUSTMENT', 'RETURN', 'AVAILABLE', 'SYSTEM', 'RFID'].includes(s)) {
    bgClass = "bg-[#fed7aa] text-black";
  }

  const sizeClasses = size === "sm"
    ? "px-2 py-0.5 text-[10px] font-black"
    : "px-2.5 py-1 text-xs font-black";

  return (
    <span className={`inline-flex items-center gap-1.5 border-2 border-black rounded-md ${sizeClasses} ${bgClass} shadow-[2px_2px_0px_0px_#000] uppercase tracking-wider`}>
      <span className="h-1.5 w-1.5 bg-black rounded-full"></span>
      {label}
    </span>
  );
}
