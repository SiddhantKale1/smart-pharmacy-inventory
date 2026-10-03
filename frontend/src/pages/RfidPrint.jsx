import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Printer, ShieldCheck, QrCode } from 'lucide-react';
import { api } from '../services/api';

export default function RfidPrint() {
  const [searchParams] = useSearchParams();

  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [tags, setTags] = useState([]);

  const [selectedMedId, setSelectedMedId] = useState(searchParams.get('medicine_id') || '');
  const [selectedBatchId, setSelectedBatchId] = useState(searchParams.get('batch_id') || '');
  const [selectedUid, setSelectedUid] = useState(searchParams.get('uid') || '');

  const [pharmacyName, setPharmacyName] = useState("APEX SMART PHARMACY");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meds, bts, tgs] = await Promise.all([
          api.getMedicines(),
          api.getBatches(),
          api.getRfidTags()
        ]);
        setMedicines(meds);
        setBatches(bts);
        setTags(tgs);

        if (!selectedMedId && meds.length > 0) setSelectedMedId(meds[0].id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const availableBatches = batches.filter(b => b.medicine_id === parseInt(selectedMedId));

  useEffect(() => {
    if (availableBatches.length > 0 && !selectedBatchId) {
      setSelectedBatchId(availableBatches[0].id);
    }
  }, [selectedMedId, availableBatches]);

  useEffect(() => {
    if (selectedBatchId) {
      const tag = tags.find(t => t.batch_id === parseInt(selectedBatchId));
      if (tag) setSelectedUid(tag.uid);
    }
  }, [selectedBatchId, tags]);

  const selectedMed = medicines.find(m => m.id === parseInt(selectedMedId));
  const selectedBatch = batches.find(b => b.id === parseInt(selectedBatchId));

  const handlePrint = () => {
    const tag = tags.find(t => t.uid === selectedUid);
    if (tag) {
      api.markTagPrinted(tag.id).catch(console.error);
    }
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="no-print">
        <h2 className="text-xl font-black text-black uppercase tracking-tight">RFID Shelf & Medicine Label Generator</h2>
        <p className="text-xs font-bold text-black/70 mt-0.5">Generate high-contrast pharmacy labels for RFID-tagged medicines.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Controls - Left Column */}
        <div className="bg-white p-5 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_#000] space-y-4 no-print md:col-span-1">
          <div className="bg-[#fef08a] -mx-5 -mt-5 p-4 rounded-t-xl border-b-2 border-black">
            <h3 className="font-black text-black text-xs uppercase">Label Configuration</h3>
          </div>

          <div>
            <label className="text-[11px] font-black uppercase text-black block mb-1">Select Medicine</label>
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
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-black uppercase text-black block mb-1">Select Batch</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full text-xs font-mono font-bold p-2 border-2 border-black rounded-lg bg-white shadow-[2px_2px_0px_0px_#000]"
            >
              {availableBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  Batch {b.batch_number} (Exp: {b.expiry_date})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-black uppercase text-black block mb-1">RFID UID</label>
            <input
              type="text"
              placeholder="e.g. 43:A7:2C:19"
              value={selectedUid}
              onChange={(e) => setSelectedUid(e.target.value)}
              className="w-full text-xs font-mono font-bold p-2 border-2 border-black rounded-lg bg-white shadow-[2px_2px_0px_0px_#000]"
            />
          </div>

          <div>
            <label className="text-[11px] font-black uppercase text-black block mb-1">Pharmacy Header Name</label>
            <input
              type="text"
              value={pharmacyName}
              onChange={(e) => setPharmacyName(e.target.value)}
              className="w-full text-xs font-bold p-2 border-2 border-black rounded-lg bg-white shadow-[2px_2px_0px_0px_#000]"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#86efac] text-black border-2 border-black rounded-xl text-xs font-black uppercase shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
            >
              <Printer className="h-4 w-4 stroke-[2.5]" />
              Print Label (Browser Print)
            </button>
            <p className="text-[10px] font-bold text-black/60 text-center mt-2">
              Supports 80x50mm thermal labels, A4 adhesive sheets, and PDF export.
            </p>
          </div>
        </div>

        {/* Label Preview - Right Column */}
        <div className="md:col-span-2 space-y-4">
          <div className="no-print flex items-center justify-between text-xs font-black text-black uppercase px-1">
            <span>PRINT PREVIEW (Exact Scale)</span>
            <span className="bg-[#bbf7d0] px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_#000]">
              Standard 80mm x 50mm Label
            </span>
          </div>

          {/* Printable Label Container */}
          <div
            id="printable-label-area"
            className="w-full max-w-[420px] mx-auto bg-white p-6 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_#000] font-sans text-black space-y-3"
          >
            {/* Pharmacy Header */}
            <div className="text-center border-b-2 border-black pb-2 bg-[#fef08a] -mx-6 -mt-6 p-4 rounded-t-xl">
              <div className="flex items-center justify-center gap-1.5 font-black text-sm tracking-tight text-black uppercase">
                <ShieldCheck className="h-5 w-5 stroke-[2.5]" />
                <span>{pharmacyName}</span>
              </div>
              <p className="text-[9px] font-mono font-bold text-black uppercase tracking-widest mt-0.5">
                IoT Verified Clinical Dispense
              </p>
            </div>

            {/* Medicine Main Info */}
            <div className="pt-2">
              <h3 className="font-black text-xl tracking-tight text-black uppercase leading-tight">
                {selectedMed?.name || "Paracetamol 500mg"}
              </h3>
              <p className="text-xs font-bold text-black/80">
                {selectedMed?.generic_name || "Acetaminophen"} • {selectedMed?.dosage || "500mg"}
              </p>
              <p className="text-[10px] font-bold text-black/60">
                Mfg: {selectedMed?.manufacturer || "GlaxoSmithKline"}
              </p>
            </div>

            {/* Lot & Expiration Grid */}
            <div className="grid grid-cols-2 gap-2 p-2 bg-[#fffdf5] rounded-lg border-2 border-black text-xs font-mono">
              <div>
                <span className="text-[9px] text-black/70 block uppercase font-sans font-black">Batch / Lot</span>
                <span className="font-black text-black text-sm">{selectedBatch?.batch_number || "PCM24081"}</span>
              </div>
              <div>
                <span className="text-[9px] text-black/70 block uppercase font-sans font-black">Expiry Date</span>
                <span className="font-black text-black bg-[#fca5a5] px-1 rounded border border-black inline-block text-xs">
                  {selectedBatch?.expiry_date || "2027-08-31"}
                </span>
              </div>
            </div>

            {/* Storage Advice */}
            <div className="text-[9px] font-bold text-black bg-[#fed7aa] p-2 rounded border border-black">
              Storage: {selectedMed?.storage_instructions || "Store below 25°C in a dry place."}
            </div>

            {/* RFID UID Barcode Strip */}
            <div className="border-t-2 border-black pt-2 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-black/70 font-black block uppercase">RC522 RFID UID</span>
                <span className="font-mono font-black text-sm tracking-wider text-black bg-[#86efac] px-2 py-0.5 rounded border border-black inline-block">
                  {selectedUid || "43:A7:2C:19"}
                </span>
                {/* Simulated Barcode visual */}
                <div className="flex items-center gap-0.5 mt-2 h-6">
                  {[4,2,6,1,3,5,2,4,7,1,3,6,2,5,3,4,1,6,3,2,5,1,4,3,2].map((w, idx) => (
                    <div key={idx} className="bg-black h-full" style={{ width: `${w}px` }}></div>
                  ))}
                </div>
              </div>

              {/* Simulated QR Code */}
              <div className="p-1 border-2 border-black rounded-lg bg-white shadow-[2px_2px_0px_0px_#000]">
                <QrCode className="h-12 w-12 text-black stroke-[1.8]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
