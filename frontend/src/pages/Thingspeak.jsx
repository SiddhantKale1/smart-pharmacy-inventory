import React, { useState, useEffect } from 'react';
import { CloudUpload, Radio, RefreshCw, ExternalLink, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';
import { api } from '../services/api';
import Badge from '../components/Badge';
import { Card } from '../components/Card';

export default function Thingspeak() {
  const [status, setStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const loadStatus = async () => {
    try {
      const data = await api.getThingspeakStatus();
      setStatus(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);
      const res = await api.syncThingspeak();
      setSyncResult(res);
      loadStatus();
    } catch (err) {
      setSyncResult({ success: false, message: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const fieldList = [
    { field: "Field 1", name: "Storage Temperature", unit: "°C", value: "22.5 °C", bg: "bg-[#bbf7d0]", desc: "Live ambient temperature probe" },
    { field: "Field 2", name: "Relative Humidity", unit: "%", value: "48.0 %", bg: "bg-[#fed7aa]", desc: "Ambient moisture level" },
    { field: "Field 3", name: "Climate Status Code", unit: "Code", value: "1 (NORMAL)", bg: "bg-[#fef08a]", desc: "1=NORMAL, 2=WARNING, 3=CRITICAL" },
    { field: "Field 4", name: "Cumulative RFID Scans", unit: "Count", value: "Scan activity", bg: "bg-[#86efac]", desc: "Total physical RFID card taps" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-black uppercase tracking-tight">ThingSpeak IoT Telemetry Gateway</h2>
          <p className="text-xs font-bold text-black/70 mt-0.5">Cloud-based IoT channel integration for external telemetry visualization.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncNow}
            disabled={syncing}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#86efac] text-black text-xs font-black uppercase rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition disabled:opacity-50"
          >
            <CloudUpload className="h-4 w-4 stroke-[2.5]" />
            {syncing ? "Broadcasting..." : "Force Sync to ThingSpeak"}
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      <div className="bg-[#fef08a] p-6 rounded-2xl border-3 border-black shadow-[6px_6px_0px_0px_#000] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-black text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
            <Radio className="h-8 w-8 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-black text-base uppercase">ThingSpeak Channel #{status?.channel_id || "Demo"}</h3>
              <Badge status={status?.status || "ONLINE"} />
            </div>
            <p className="text-xs font-bold text-black/80 mt-1 max-w-xl">
              {status?.configured
                ? "Live HTTP API integration active with configured ThingSpeak Write Key."
                : "Operating in Local/Demo Telemetry mode. PostgreSQL remains primary database."}
            </p>
            <div className="flex items-center gap-4 text-xs font-mono font-bold text-black mt-2">
              <span>Total Payloads: <b>{status?.total_payloads_sent || 0}</b></span>
              <span>Last Broadcast: <b>{status?.last_feed_time || "Recent"}</b></span>
            </div>
          </div>
        </div>

        {status?.channel_id && status.channel_id !== "Demo Channel" && (
          <a
            href={`https://thingspeak.com/channels/${status.channel_id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border-2 border-black text-black text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
          >
            <span>Open Channel</span>
            <ExternalLink className="h-3.5 w-3.5 stroke-[2.5]" />
          </a>
        )}
      </div>

      {syncResult && (
        <div className={`p-4 rounded-xl text-xs font-mono font-bold border-2 border-black shadow-[3px_3px_0px_0px_#000] ${
          syncResult.success ? "bg-[#86efac] text-black" : "bg-[#fca5a5] text-black"
        }`}>
          {syncResult.success ? (
            <div>Telemetry successfully published to ThingSpeak channel fields 1-4.</div>
          ) : (
            <div>Sync Notice: {syncResult.message}</div>
          )}
        </div>
      )}

      {/* Field Mapping Grid (Vibrant yellow, lime, orange - NO purple/blue) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {fieldList.map((f, i) => (
          <div key={i} className={`p-5 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_#000] space-y-2 ${f.bg}`}>
            <span className="text-[10px] font-mono font-black text-black bg-white px-2 py-0.5 rounded border border-black uppercase shadow-[1px_1px_0px_0px_#000]">
              {f.field}
            </span>
            <h4 className="font-black text-black text-sm uppercase mt-1">{f.name}</h4>
            <p className="text-xs font-bold text-black/70">{f.desc}</p>
            <div className="pt-2 border-t-2 border-black/20 flex justify-between text-xs font-mono font-bold text-black">
              <span>Unit: {f.unit}</span>
              <span className="bg-white px-1.5 rounded border border-black">{f.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Architectural Notice */}
      <div className="p-5 bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] text-black space-y-2">
        <h4 className="font-black text-sm uppercase flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
          PostgreSQL Architectural Source of Truth
        </h4>
        <p className="text-xs font-bold text-black/80 leading-relaxed">
          As required by the clinical project specification: <b>PostgreSQL is the single source of truth</b> for all medicines, batches, inventory deduction, and transactions. ThingSpeak acts strictly as an auxiliary IoT broadcast layer and external cloud telemetry display.
        </p>
      </div>
    </div>
  );
}
