import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Radio, ScanLine, CheckCircle2, AlertTriangle, ArrowRight, Printer, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import Badge from '../components/Badge';

export default function RfidAssign() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedMedId, setSelectedMedId] = useState(searchParams.get('medicine_id') || '');
  const [selectedBatchId, setSelectedBatchId] = useState(searchParams.get('batch_id') || '');

  const [rfidUid, setRfidUid] = useState('');
  const [loading, setLoading] = useState(false);
  const [assignmentResult, setAssignmentResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const [meds, bts] = await Promise.all([
          api.getMedicines(),
          api.getBatches()
        ]);
        setMedicines(meds);
        setBatches(bts);

        if (!selectedMedId && meds.length > 0) {
          setSelectedMedId(meds[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCatalog();
  }, []);

  const availableBatches = batches.filter(b => b.medicine_id === parseInt(selectedMedId));
  const [hardwareDetectedUid, setHardwareDetectedUid] = useState(null);

  // Poll for live hardware RFID taps from the ESP32 RC522
  useEffect(() => {
    let lastSeen = null;
    const interval = setInterval(async () => {
      try {
        const tap = await api.getLatestRfidTap();
        if (tap && tap.uid && tap.uid !== lastSeen) {
          lastSeen = tap.uid;
          setHardwareDetectedUid(tap.uid);
          setRfidUid(tap.uid);
        }
      } catch (e) {
        // silent polling ignore
      }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (availableBatches.length > 0 && !selectedBatchId) {
      setSelectedBatchId(availableBatches[0].id);
    }
  }, [selectedMedId, availableBatches]);

  const selectedMed = medicines.find(m => m.id === parseInt(selectedMedId));
  const selectedBatch = batches.find(b => b.id === parseInt(selectedBatchId));

  const handleAssign = async (uidToUse) => {
    const targetUid = uidToUse || rfidUid;
    if (!targetUid) {
      alert("Please enter or scan an RFID UID.");
      return;
    }
    if (!selectedMedId || !selectedBatchId) {
      alert("Please select a medicine and batch to link.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      setAssignmentResult(null);

      const res = await api.registerRfidTag({
        uid: targetUid,
        medicine_id: parseInt(selectedMedId),
        batch_id: parseInt(selectedBatchId)
      });

      setAssignmentResult({
        ...res,
        medicine: selectedMed?.name,
        batch: selectedBatch?.batch_number,
        expiry: selectedBatch?.expiry_date,
        quantity: selectedBatch?.quantity_remaining,
        uid: targetUid
      });
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-black uppercase tracking-tight">RFID Tag Registration & Pairing</h2>
        <p className="text-xs font-bold text-black/70 mt-0.5">Associate a physical high-frequency RFID tag UID with received stock batches.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Step 1: Select Medicine & Batch */}
        <div className="bg-white p-5 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_#000] space-y-4 md:col-span-1">
          <div className="flex items-center gap-2 border-b-2 border-black pb-3 bg-[#fef08a] -mx-5 -mt-5 p-4 rounded-t-xl">
            <span className="h-6 w-6 rounded-md bg-black text-white font-black text-xs flex items-center justify-center">1</span>
            <h3 className="font-black text-black text-xs uppercase">Select Target Batch</h3>
          </div>

          <div>
            <label className="text-[11px] font-black uppercase text-black block mb-1">Target Medicine</label>
            <select
              value={selectedMedId}
              onChange={(e) => {
                setSelectedMedId(e.target.value);
                setSelectedBatchId('');
              }}
              className="w-full text-xs font-bold p-2 border-2 border-black rounded-lg bg-white shadow-[2px_2px_0px_0px_#000]"
            >
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.dosage})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-black uppercase text-black block mb-1">Target Batch</label>
            {availableBatches.length === 0 ? (
              <p className="text-xs text-black font-bold bg-[#fca5a5] p-2 rounded-lg border-2 border-black">
                No active batches found.
              </p>
            ) : (
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full text-xs font-mono font-bold p-2 border-2 border-black rounded-lg bg-white shadow-[2px_2px_0px_0px_#000]"
              >
                {availableBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    Batch {b.batch_number} (Exp: {b.expiry_date} | Qty: {b.quantity_remaining})
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedBatch && (
            <div className="p-3 bg-[#bbf7d0] border-2 border-black rounded-xl space-y-1.5 text-xs text-black font-mono shadow-[2px_2px_0px_0px_#000]">
              <div className="flex justify-between">
                <span className="font-sans font-bold uppercase text-[10px]">Lot:</span>
                <span className="font-black">{selectedBatch.batch_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans font-bold uppercase text-[10px]">Expiry:</span>
                <span className="font-black">{selectedBatch.expiry_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans font-bold uppercase text-[10px]">Units:</span>
                <span className="font-black text-sm">{selectedBatch.quantity_remaining}</span>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Tap RFID Tag & Pair */}
        <div className="bg-white p-5 rounded-2xl border-3 border-black shadow-[6px_6px_0px_0px_#000] space-y-5 md:col-span-2 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-md bg-black text-white font-black text-xs flex items-center justify-center">2</span>
                <h3 className="font-black text-black text-sm uppercase">Tap Tag on ESP32 RC522 Reader</h3>
              </div>
              <Badge status="READY" text="Ready to assign RFID tag" size="sm" />
            </div>

            {/* Waiting Radar Pulse Animation */}
            <div className="p-8 border-3 border-black rounded-2xl bg-[#fef08a] text-center shadow-[4px_4px_0px_0px_#000]">
              <div className="h-16 w-16 mx-auto rounded-xl bg-black text-white flex items-center justify-center mb-3 shadow-[3px_3px_0px_0px_#000] animate-bounce">
                <Radio className="h-8 w-8 stroke-[2.5]" />
              </div>
              <p className="font-black text-black text-base uppercase">Ready to assign RFID tag</p>
              <p className="text-xs font-bold text-black/80 max-w-sm mx-auto mt-1">
                Bring RFID card or tag within 3cm of the RC522 reader. The ESP32 reads the chip UID and completes the association.
              </p>
            </div>

            {/* Live Hardware Tap Banner */}
            {hardwareDetectedUid && (
              <div className="p-3 bg-[#86efac] border-2 border-black rounded-xl flex items-center justify-between text-xs font-black shadow-[3px_3px_0px_0px_#000]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-700 animate-ping"></span>
                  <span>⚡ LIVE RC522 TAG DETECTED: <code className="bg-white px-2 py-0.5 border-2 border-black rounded-md font-mono text-black">{hardwareDetectedUid}</code></span>
                </div>
                <span className="px-2 py-0.5 bg-black text-white text-[10px] uppercase font-black rounded-md">
                  Auto-Loaded
                </span>
              </div>
            )}

            {/* Manual or Simulated Tag Input */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-black block">
                Manual UID Entry / Quick Test UID:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 43:A7:2C:19 or CC:DD:EE:FF"
                  value={rfidUid}
                  onChange={(e) => setRfidUid(e.target.value)}
                  className="flex-1 text-xs font-mono font-bold p-2.5 border-2 border-black rounded-xl bg-white shadow-[2px_2px_0px_0px_#000]"
                />
                <button
                  type="button"
                  onClick={() => setRfidUid("AA:BB:CC:DD")}
                  className="px-3 py-1.5 bg-[#fed7aa] text-black border-2 border-black rounded-xl text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
                >
                  Demo Tag
                </button>
              </div>
            </div>

            <button
              onClick={() => handleAssign()}
              disabled={loading || !selectedBatchId}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#86efac] text-black rounded-xl text-xs font-black uppercase border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition disabled:opacity-50"
            >
              <ScanLine className="h-4 w-4 stroke-[2.5]" />
              {loading ? "Pairing Tag..." : "Confirm & Pair RFID UID to Batch"}
            </button>
          </div>

          {/* Feedback & Error */}
          {errorMessage && (
            <div className="p-3 bg-[#fca5a5] border-2 border-black rounded-xl text-black text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_0px_#000]">
              <AlertTriangle className="h-4 w-4 text-black shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {assignmentResult && (
            <div className="p-4 bg-[#86efac] border-2 border-black rounded-xl space-y-3 shadow-[4px_4px_0px_0px_#000] animate-in fade-in">
              <div className="flex items-center gap-2 text-black font-black text-sm uppercase">
                <CheckCircle2 className="h-5 w-5 stroke-[3]" />
                <span>RFID Tag Paired Successfully!</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono font-bold bg-white p-3 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                <div>UID: <b>{assignmentResult.uid}</b></div>
                <div>Status: <Badge status="ASSIGNED" size="sm" /></div>
                <div>Medicine: <b>{assignmentResult.medicine}</b></div>
                <div>Batch: <b>{assignmentResult.batch}</b></div>
                <div>Expiry: <b>{assignmentResult.expiry}</b></div>
                <div>Quantity: <b>{assignmentResult.quantity}</b></div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Link
                  to={`/rfid/print?uid=${assignmentResult.uid}&medicine_id=${selectedMedId}&batch_id=${selectedBatchId}`}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-black text-xs font-black uppercase rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
                >
                  <Printer className="h-3.5 w-3.5 stroke-[2.5]" />
                  Print Shelf Label Now
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
