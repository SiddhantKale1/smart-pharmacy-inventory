import React, { useState, useEffect } from 'react';
import { ShoppingCart, Radio, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Receipt } from 'lucide-react';
import { api } from '../services/api';
import Badge from '../components/Badge';

export default function SalesTerminal() {
  const [uidInput, setUidInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [latestSale, setLatestSale] = useState(null);
  const [recentSales, setRecentSales] = useState([]);

  const loadRecentSales = async () => {
    try {
      const txs = await api.getTransactions("SALE", 8);
      setRecentSales(txs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadRecentSales();
    const interval = setInterval(loadRecentSales, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleScan = async (uidToScan) => {
    const uid = uidToScan || uidInput;
    if (!uid) {
      alert("Please enter or scan an RFID UID.");
      return;
    }

    try {
      setLoading(true);
      setLatestSale(null);
      const res = await api.scanRfid(uid);
      setLatestSale({
        ...res,
        uid: uid,
        timestamp: new Date().toLocaleTimeString()
      });
      loadRecentSales();
      if (!uidToScan) setUidInput('');
    } catch (err) {
      setLatestSale({
        success: false,
        message: err.message,
        uid: uid,
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setLoading(false);
    }
  };

  const sampleButtons = [
    { label: "Tap Paracetamol (43:A7:2C:19)", uid: "43:A7:2C:19", bg: "bg-[#86efac]" },
    { label: "Tap Amoxicillin (A1:B2:C3:D4)", uid: "A1:B2:C3:D4", bg: "bg-[#fed7aa]" },
    { label: "Tap EXPIRED Cetirizine (12:34:56:78)", uid: "12:34:56:78", bg: "bg-[#f87171]" },
    { label: "Tap Unknown Chip (99:99:99:99)", uid: "99:99:99:99", bg: "bg-[#fef08a]" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-black uppercase tracking-tight">Point-of-Sale (POS) RFID Sales Terminal</h2>
          <p className="text-xs font-bold text-black/70 mt-0.5">
            Physical RC522 RFID checkout interface. Automatic expiry protection & PostgreSQL stock deduction.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge status="ONLINE" text="RC522 Listener Active" size="sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Terminal Input & Tap Monitor */}
        <div className="lg:col-span-2 space-y-5">
          {/* Main Tap Box */}
          <div className="bg-white p-6 rounded-2xl border-3 border-black shadow-[6px_6px_0px_0px_#000] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-black stroke-[3] animate-pulse" />
                <h3 className="font-black text-black text-sm uppercase">RC522 Hardware RFID Receiver</h3>
              </div>
              <span className="text-xs font-mono text-black font-black bg-[#fef08a] px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_#000]">
                PORT: /api/rfid/scan
              </span>
            </div>

            <p className="text-xs font-bold text-black/80">
              When a customer purchases medicine, tap the tagged product onto the RC522 reader. The ESP32 transmits the UID to immediately check expiry, decrement quantity by 1, and log an immutable SALE transaction.
            </p>

            {/* Quick Demo Tap Buttons (Neobrutalism lime, orange, coral, yellow - NO blue/purple) */}
            <div>
              <span className="text-[11px] font-black text-black uppercase tracking-wider block mb-2">
                Simulated RC522 Taps (For Live Examination):
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {sampleButtons.map((btn) => (
                  <button
                    key={btn.uid}
                    onClick={() => handleScan(btn.uid)}
                    disabled={loading}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#000] transition text-left flex items-center justify-between ${btn.bg} text-black`}
                  >
                    <span>{btn.label}</span>
                    <Radio className="h-4 w-4 shrink-0 stroke-[2.5]" />
                  </button>
                ))}
              </div>
            </div>

            {/* Manual UID form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleScan();
              }}
              className="pt-3 border-t-2 border-black flex gap-2"
            >
              <input
                type="text"
                placeholder="Enter or scan custom RFID UID (e.g. 43:A7:2C:19)..."
                value={uidInput}
                onChange={(e) => setUidInput(e.target.value)}
                className="flex-1 text-xs font-mono font-bold p-2.5 border-2 border-black rounded-xl bg-[#fffdf5] text-black shadow-[2px_2px_0px_0px_#000] focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-[#86efac] text-black border-2 border-black rounded-xl text-xs font-black uppercase shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
              >
                {loading ? "Processing..." : "Process Scan"}
              </button>
            </form>
          </div>

          {/* Real-time Tap Response Card */}
          {latestSale && (
            <div className={`p-6 rounded-2xl border-3 border-black shadow-[6px_6px_0px_0px_#000] transition-all ${
              latestSale.success
                ? "bg-[#86efac] text-black"
                : "bg-[#fca5a5] text-black"
            }`}>
              <div className="flex items-center justify-between pb-3 border-b-2 border-black">
                <div className="flex items-center gap-2 font-black text-base uppercase">
                  {latestSale.success ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 stroke-[3]" />
                      <span>{latestSale.message}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6 stroke-[3]" />
                      <span>SALE BLOCKED: {latestSale.message}</span>
                    </>
                  )}
                </div>
                <span className="text-xs font-mono font-black">{latestSale.timestamp}</span>
              </div>

              {latestSale.success ? (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                    <span className="text-[10px] text-black/60 block font-sans font-black uppercase">Medicine</span>
                    <span className="font-black text-black text-sm">{latestSale.medicine}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                    <span className="text-[10px] text-black/60 block font-sans font-black uppercase">Batch Lot</span>
                    <span className="font-black text-black text-sm">{latestSale.batch}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                    <span className="text-[10px] text-black/60 block font-sans font-black uppercase">Deduction</span>
                    <span className="font-black text-black text-sm">-1 Unit</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                    <span className="text-[10px] text-black/60 block font-sans font-black uppercase">Remaining</span>
                    <span className="font-black text-black text-sm">{latestSale.remaining_quantity} Units</span>
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-xs bg-white p-3 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] font-mono">
                  <div>Tag Scanned: <b>{latestSale.uid}</b></div>
                  <div className="font-black uppercase mt-1">Reason: {latestSale.message}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Checkout Log */}
        <div className="bg-white p-5 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-3 bg-[#fef08a] -mx-5 -mt-5 p-4 rounded-t-xl">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-black stroke-[2.5]" />
                <h3 className="font-black text-black text-sm uppercase">Recent POS Sales</h3>
              </div>
              <button onClick={loadRecentSales} className="text-black hover:rotate-45 transition">
                <RefreshCw className="h-3.5 w-3.5 stroke-[2.5]" />
              </button>
            </div>

            <div className="space-y-2">
              {recentSales.length === 0 ? (
                <p className="text-xs text-black/50 font-bold text-center py-8">No checkouts recorded yet.</p>
              ) : (
                recentSales.map((sale) => (
                  <div key={sale.id} className="p-2.5 rounded-lg border-2 border-black bg-[#fffdf5] shadow-[2px_2px_0px_0px_#000] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-black">{sale.medicine_name}</span>
                      <span className="font-black text-black bg-[#f87171] px-1.5 py-0.2 rounded border border-black">-{sale.quantity}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-black/70 font-mono font-bold">
                      <span>UID: {sale.rfid_uid || 'Direct'}</span>
                      <span>{sale.created_at?.split(' ')[1]}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t-2 border-black text-[10px] text-black font-black uppercase text-center font-mono mt-4">
            Transaction type: SALE | Method: RC522 SPI
          </div>
        </div>
      </div>
    </div>
  );
}
