import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertTriangle, AlertOctagon, Info, RefreshCw, CheckCheck } from 'lucide-react';
import { api } from '../services/api';
import Badge from '../components/Badge';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('');
  const [showResolved, setShowResolved] = useState(false);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await api.getAlerts(category, severity, showResolved ? null : false);
      setAlerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [category, severity, showResolved]);

  const handleResolve = async (id) => {
    try {
      await api.resolveAlert(id);
      loadAlerts();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleResolveAll = async () => {
    if (!window.confirm("Mark all active alerts as resolved?")) return;
    try {
      await api.resolveAllAlerts();
      loadAlerts();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const categories = ["", "EXPIRY", "STOCK", "TEMPERATURE", "HUMIDITY", "RFID", "SYSTEM"];
  const severities = ["", "CRITICAL", "WARNING", "INFO"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-black uppercase tracking-tight">Active Alerts & Expiry Monitoring</h2>
          <p className="text-xs font-bold text-black/70 mt-0.5">Automated notifications for expiring medicines, stock deficits, and cold-chain violations.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResolveAll}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#86efac] text-black text-xs font-black uppercase rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
          >
            <CheckCheck className="h-4 w-4 stroke-[2.5]" />
            Resolve All Active
          </button>
          <button
            onClick={loadAlerts}
            className="p-2 border-2 border-black bg-white rounded-xl text-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
            title="Refresh alerts"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#fef08a] p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-black text-black uppercase">Category:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="p-1.5 border-2 border-black rounded-lg bg-white font-bold text-black shadow-[2px_2px_0px_0px_#000]"
            >
              <option value="">All Categories</option>
              {categories.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-black text-black uppercase">Severity:</span>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="p-1.5 border-2 border-black rounded-lg bg-white font-bold text-black shadow-[2px_2px_0px_0px_#000]"
            >
              <option value="">All Severities</option>
              {severities.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Resolved Toggle */}
        <label className="flex items-center gap-2 cursor-pointer font-black text-black uppercase select-none">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            className="rounded border-2 border-black text-black focus:ring-0 accent-black h-4 w-4"
          />
          <span>Include Resolved History</span>
        </label>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {loading && alerts.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-black p-12 text-center text-black font-black text-xs shadow-[4px_4px_0px_0px_#000]">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
            LOADING ALERTS...
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-[#bbf7d0] rounded-xl border-2 border-black p-12 text-center text-black shadow-[4px_4px_0px_0px_#000]">
            <CheckCircle2 className="h-10 w-10 text-black mx-auto mb-2 stroke-[2.5]" />
            <span className="font-black text-base uppercase block">All Systems Operational</span>
            <span className="text-xs font-bold text-black/70">No active alerts found matching current filter criteria.</span>
          </div>
        ) : (
          alerts.map((a) => {
            const isCritical = a.severity === "CRITICAL";
            const isWarning = a.severity === "WARNING";

            return (
              <div
                key={a.id}
                className={`p-4 rounded-xl border-2 border-black transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[4px_4px_0px_0px_#000] ${
                  a.resolved
                    ? "bg-slate-100 opacity-60"
                    : isCritical
                    ? "bg-[#fecaca]"
                    : isWarning
                    ? "bg-[#fef08a]"
                    : "bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {isCritical ? (
                      <AlertOctagon className="h-6 w-6 text-black stroke-[2.5]" />
                    ) : isWarning ? (
                      <AlertTriangle className="h-6 w-6 text-black stroke-[2.5]" />
                    ) : (
                      <Info className="h-6 w-6 text-black stroke-[2.5]" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge status={a.severity} size="sm" />
                      <span className="text-[10px] font-mono font-black text-black uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_#000]">
                        {a.alert_type}
                      </span>
                      {a.resolved && (
                        <span className="text-[10px] text-black font-black bg-[#86efac] px-2 py-0.5 rounded border border-black">
                          RESOLVED
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-black text-black mt-1.5">{a.message}</p>

                    <div className="flex items-center gap-4 text-[11px] text-black/80 font-mono font-bold mt-2">
                      {a.medicine_name && <span>Item: <b>{a.medicine_name}</b></span>}
                      {a.batch_number && <span>Batch: <b>{a.batch_number}</b></span>}
                      <span>Time: {a.created_at}</span>
                    </div>
                  </div>
                </div>

                {!a.resolved && (
                  <button
                    onClick={() => handleResolve(a.id)}
                    className="self-end sm:self-center px-3.5 py-1.5 rounded-lg border-2 border-black bg-white hover:bg-[#86efac] text-black text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
