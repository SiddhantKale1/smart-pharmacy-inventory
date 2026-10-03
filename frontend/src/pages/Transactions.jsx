import React, { useState, useEffect } from 'react';
import { Receipt, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import Badge from '../components/Badge';

export default function Transactions() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await api.getTransactions(typeFilter);
      setTxs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [typeFilter]);

  const tabs = [
    { label: "All Logs", value: "" },
    { label: "Sales (POS/RFID)", value: "SALE" },
    { label: "Restocks (Invoices)", value: "RESTOCK" },
    { label: "Adjustments", value: "ADJUSTMENT" },
    { label: "Returns", value: "RETURN" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-black uppercase tracking-tight">Audit & Transaction Trail</h2>
          <p className="text-xs font-bold text-black/70 mt-0.5">Immutable audit logs for every RFID tap, supplier invoice restock, and inventory deduction.</p>
        </div>
        <button
          onClick={loadTransactions}
          className="p-2 border-2 border-black bg-white rounded-xl text-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
          title="Refresh logs"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-[#fef08a] p-3 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] flex flex-wrap gap-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setTypeFilter(tab.value)}
            className={`px-3 py-1.5 text-xs font-black uppercase rounded-lg border-2 border-black transition ${
              typeFilter === tab.value
                ? 'bg-black text-white shadow-[2px_2px_0px_0px_#fff]'
                : 'bg-white text-black hover:bg-[#86efac] shadow-[2px_2px_0px_0px_#000]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#fde047] border-b-2 border-black text-black font-black uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">TX ID</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Medicine Item</th>
                <th className="py-3 px-4">Batch Number</th>
                <th className="py-3 px-4">RFID UID</th>
                <th className="py-3 px-4 text-center">Quantity Delta</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Notes & Audit Trail</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/10 text-black">
              {loading && txs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-black font-black">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-black" />
                    LOADING AUDIT TRAIL...
                  </td>
                </tr>
              ) : txs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-black/70 font-bold">
                    No transactions found for selected filter.
                  </td>
                </tr>
              ) : (
                txs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#fff9db] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-black">
                      #{tx.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={tx.transaction_type} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 font-black text-black">
                      {tx.medicine_name || "Medicine"}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-black">
                      {tx.batch_number || "—"}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">
                      {tx.rfid_uid ? (
                        <span className="bg-[#fed7aa] px-2 py-0.5 rounded font-black text-black border-2 border-black shadow-[1px_1px_0px_0px_#000]">
                          {tx.rfid_uid}
                        </span>
                      ) : (
                        <span className="text-black/50 italic font-bold">Direct Entry</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-black text-sm">
                      {tx.transaction_type === "SALE" ? (
                        <span className="text-black bg-[#f87171] px-1.5 py-0.2 rounded border border-black">-{tx.quantity}</span>
                      ) : (
                        <span className="text-black bg-[#86efac] px-1.5 py-0.2 rounded border border-black">+{tx.quantity}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-black font-bold text-[11px]">
                      {tx.created_at}
                    </td>
                    <td className="py-3.5 px-4 text-black text-[11px] font-bold max-w-xs truncate">
                      {tx.notes || "Standard operation"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
