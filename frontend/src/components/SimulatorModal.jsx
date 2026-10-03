import React, { useState } from 'react';
import { Cpu, Radio, Thermometer, Droplets, RefreshCw, Send, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { api } from '../services/api';
import Modal from './Modal';

export default function SimulatorModal({ isOpen, onClose, onActionCompleted }) {
  const [rfidUid, setRfidUid] = useState('43:A7:2C:19');
  const [temp, setTemp] = useState(23.5);
  const [humidity, setHumidity] = useState(48.0);
  
  const [rfidResult, setRfidResult] = useState(null);
  const [sensorResult, setSensorResult] = useState(null);
  const [loadingRfid, setLoadingRfid] = useState(false);
  const [loadingSensor, setLoadingSensor] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  const sampleTags = [
    { label: "Paracetamol 500mg (Active)", uid: "43:A7:2C:19" },
    { label: "Amoxicillin 500mg (Safe)", uid: "A1:B2:C3:D4" },
    { label: "Cetirizine 10mg (EXPIRED)", uid: "12:34:56:78" },
    { label: "Azithromycin 500mg (Low Stock)", uid: "E5:F6:17:28" },
    { label: "Unassigned Free Tag", uid: "AA:BB:CC:DD" },
  ];

  const handleSimulateScan = async () => {
    try {
      setLoadingRfid(true);
      setRfidResult(null);
      const res = await api.simulateRfidTap(rfidUid);
      setRfidResult(res);
      if (onActionCompleted) onActionCompleted();
    } catch (err) {
      setRfidResult({ success: false, message: err.message });
    } finally {
      setLoadingRfid(false);
    }
  };

  const handleSimulateSensor = async () => {
    try {
      setLoadingSensor(true);
      setSensorResult(null);
      const res = await api.simulateSensorPush(parseFloat(temp), parseFloat(humidity));
      setSensorResult(res);
      if (onActionCompleted) onActionCompleted();
    } catch (err) {
      setSensorResult({ success: false, message: err.message });
    } finally {
      setLoadingSensor(false);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm("Reset database to initial clinical demo state?")) return;
    try {
      setLoadingReset(true);
      await api.resetDemoData();
      alert("Database reset to initial demo state!");
      if (onActionCompleted) onActionCompleted();
      onClose();
    } catch (err) {
      alert("Reset error: " + err.message);
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ESP32 Virtual Hardware Simulator" maxWidth="max-w-2xl">
      <div className="space-y-6 text-black">
        <div className="p-3 bg-[#fef08a] border-2 border-black rounded-lg text-xs font-bold shadow-[3px_3px_0px_0px_#000]">
          Simulates hardware signals sent by ESP32 DevKit, RC522 reader, and DHT22 environment sensor over HTTP.
        </div>

        {/* Section 1: RFID Tap Simulation */}
        <div className="p-4 rounded-xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000] space-y-3">
          <div className="flex items-center gap-2 border-b-2 border-black pb-2">
            <Radio className="h-4 w-4 text-black stroke-[2.5]" />
            <h4 className="font-black text-xs uppercase tracking-wider text-black">
              RC522 RFID Card Tap (POST /api/rfid/scan)
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase text-black block mb-1">Preset RFID Tag:</label>
              <select
                className="w-full text-xs font-mono p-2 border-2 border-black rounded-lg bg-white shadow-[2px_2px_0px_0px_#000]"
                value={rfidUid}
                onChange={(e) => setRfidUid(e.target.value)}
              >
                {sampleTags.map((t) => (
                  <option key={t.uid} value={t.uid}>
                    {t.label} ({t.uid})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-black block mb-1">Custom UID String:</label>
              <input
                type="text"
                className="w-full text-xs font-mono p-2 border-2 border-black rounded-lg bg-white shadow-[2px_2px_0px_0px_#000]"
                value={rfidUid}
                onChange={(e) => setRfidUid(e.target.value)}
                placeholder="43:A7:2C:19"
              />
            </div>
          </div>

          <button
            onClick={handleSimulateScan}
            disabled={loadingRfid}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#86efac] text-black text-xs font-black uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#000] transition"
          >
            <Send className="h-3.5 w-3.5 stroke-[2.5]" />
            {loadingRfid ? "Emulating Tap..." : "Simulate Card Tap (Trigger Sale / Block)"}
          </button>

          {rfidResult && (
            <div className={`p-3 rounded-lg text-xs font-mono border-2 border-black shadow-[3px_3px_0px_0px_#000] ${
              rfidResult.success ? "bg-[#86efac] text-black" : "bg-[#fca5a5] text-black"
            }`}>
              <div className="flex items-center gap-1.5 font-black uppercase mb-1">
                {rfidResult.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <span>{rfidResult.message}</span>
              </div>
              {rfidResult.medicine && <div>Medicine: <b>{rfidResult.medicine}</b></div>}
              {rfidResult.batch && <div>Batch: <b>{rfidResult.batch}</b></div>}
              {rfidResult.remaining_quantity !== null && rfidResult.remaining_quantity !== undefined && (
                <div>Remaining Quantity: <b>{rfidResult.remaining_quantity}</b></div>
              )}
            </div>
          )}
        </div>

        {/* Section 2: DHT22 Climate Simulation */}
        <div className="p-4 rounded-xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000] space-y-3">
          <div className="flex items-center gap-2 border-b-2 border-black pb-2">
            <Thermometer className="h-4 w-4 text-black stroke-[2.5]" />
            <h4 className="font-black text-xs uppercase tracking-wider text-black">
              DHT22 Environment Telemetry (POST /api/sensor)
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-xs font-black text-black mb-1">
                <span>Temperature (°C)</span>
                <span className="font-mono bg-[#bbf7d0] px-1.5 py-0.5 border border-black rounded">{temp}°C</span>
              </div>
              <input
                type="range"
                min="10"
                max="45"
                step="0.5"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                className="w-full accent-black cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-black text-black mb-1">
                <span>Humidity (%)</span>
                <span className="font-mono bg-[#fed7aa] px-1.5 py-0.5 border border-black rounded">{humidity}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="90"
                step="0.5"
                value={humidity}
                onChange={(e) => setHumidity(e.target.value)}
                className="w-full accent-black cursor-pointer"
              />
            </div>
          </div>

          {/* Quick preset buttons (Yellow, Lime, Coral, Orange - NO blue/purple) */}
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => { setTemp(22.0); setHumidity(45.0); }}
              className="px-2.5 py-1 rounded-md border-2 border-black bg-[#86efac] text-black font-black uppercase text-[10px] shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
            >
              Preset: Normal (22°C / 45%)
            </button>
            <button
              onClick={() => { setTemp(34.5); setHumidity(55.0); }}
              className="px-2.5 py-1 rounded-md border-2 border-black bg-[#f87171] text-black font-black uppercase text-[10px] shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
            >
              Preset: High Temp Critical (34.5°C)
            </button>
            <button
              onClick={() => { setTemp(23.0); setHumidity(82.0); }}
              className="px-2.5 py-1 rounded-md border-2 border-black bg-[#fed7aa] text-black font-black uppercase text-[10px] shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
            >
              Preset: High Humidity Alert (82%)
            </button>
          </div>

          <button
            onClick={handleSimulateSensor}
            disabled={loadingSensor}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#fed7aa] text-black text-xs font-black uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#000] transition"
          >
            <Droplets className="h-3.5 w-3.5 stroke-[2.5]" />
            {loadingSensor ? "Broadcasting..." : "Push Sensor Readings to Database & ThingSpeak"}
          </button>

          {sensorResult && (
            <div className="p-3 rounded-lg text-xs font-mono bg-[#bbf7d0] border-2 border-black shadow-[3px_3px_0px_0px_#000] text-black">
              <div className="font-black uppercase">Climate Status: {sensorResult.overall_status} (Temp: {sensorResult.temperature_status}, Hum: {sensorResult.humidity_status})</div>
              <div>Telemetry evaluated against clinical medicine cold-chain parameters.</div>
            </div>
          )}
        </div>

        {/* Section 3: Reset Demo Database */}
        <div className="pt-2 border-t-2 border-black flex items-center justify-between">
          <div>
            <h5 className="font-black text-xs uppercase text-black">Reinitialize Demo Dataset</h5>
            <p className="text-[11px] font-bold text-slate-600">Restores all medicines, batches, sample RFID tags, and invoices.</p>
          </div>
          <button
            onClick={handleResetData}
            disabled={loadingReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black bg-[#fca5a5] text-black text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingReset ? 'animate-spin' : ''}`} />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
