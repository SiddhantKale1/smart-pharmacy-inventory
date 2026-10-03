import React, { useState, useEffect } from 'react';
import { Pill, Plus, Search, RefreshCw, Trash2, Thermometer, Droplets } from 'lucide-react';
import { api } from '../services/api';
import Modal from '../components/Modal';

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    generic_name: '',
    manufacturer: '',
    category: 'Analgesic',
    dosage: '500mg',
    form: 'Tablet',
    storage_instructions: 'Store below 25°C in a dry place',
    min_temperature: 15.0,
    max_temperature: 25.0,
    min_humidity: 30.0,
    max_humidity: 65.0,
    reorder_level: 10
  });

  const loadMedicines = async () => {
    try {
      setLoading(true);
      const data = await api.getMedicines(search);
      setMedicines(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.createMedicine(form);
      setIsModalOpen(false);
      setForm({
        name: '',
        generic_name: '',
        manufacturer: '',
        category: 'Analgesic',
        dosage: '500mg',
        form: 'Tablet',
        storage_instructions: 'Store below 25°C in a dry place',
        min_temperature: 15.0,
        max_temperature: 25.0,
        min_humidity: 30.0,
        max_humidity: 65.0,
        reorder_level: 10
      });
      loadMedicines();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? All associated batches will be removed.`)) return;
    try {
      await api.deleteMedicine(id);
      loadMedicines();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-black uppercase tracking-tight">Medicine Catalog</h2>
          <p className="text-xs font-bold text-black/70 mt-0.5">Pharmaceutical product catalog with clinical storage specifications and thresholds.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#86efac] text-black text-xs font-black uppercase rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          Add New Medicine
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-[#fef08a] p-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] flex items-center gap-3">
        <Search className="h-4 w-4 text-black ml-2" />
        <input
          type="text"
          placeholder="Search by brand name, generic formulation, or manufacturer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadMedicines()}
          className="w-full text-xs font-bold bg-white p-1.5 rounded border border-black text-black focus:outline-none"
        />
        <button
          onClick={loadMedicines}
          className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-black border-2 border-black rounded-lg text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]"
        >
          Search
        </button>
      </div>

      {/* Medicine Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && medicines.length === 0 ? (
          <div className="col-span-full py-16 text-center text-black font-black text-xs">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-black" />
            LOADING CATALOG...
          </div>
        ) : medicines.map((m) => (
          <div key={m.id} className="bg-white rounded-xl border-2 border-black p-5 shadow-[4px_4px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black text-black bg-[#86efac] px-2 py-0.5 rounded border border-black uppercase tracking-wider shadow-[1px_1px_0px_0px_#000]">
                    {m.category || "General"}
                  </span>
                  <h3 className="font-black text-black text-base mt-2 uppercase">{m.name}</h3>
                  <p className="text-xs text-black/70 font-bold italic">{m.generic_name || m.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-black text-black bg-[#fed7aa] px-1.5 py-0.5 rounded border border-black block">{m.dosage}</span>
                  <span className="block text-[10px] text-black/60 font-bold mt-1 uppercase">{m.form}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t-2 border-black/10 space-y-1.5 text-xs text-black font-bold">
                <div className="flex justify-between">
                  <span>Manufacturer:</span>
                  <span>{m.manufacturer || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Total Stock:</span>
                  <span className="font-black bg-[#bbf7d0] px-1 rounded border border-black">{m.total_stock} units</span>
                </div>
                <div className="flex justify-between">
                  <span>Reorder Level:</span>
                  <span>{m.reorder_level} units</span>
                </div>
              </div>

              {/* Climate Limits Badge (Lime & Tangerine - NO blue) */}
              <div className="mt-3 p-2 rounded-lg bg-[#fffdf5] border-2 border-black flex items-center justify-between text-[11px] font-black text-black shadow-[2px_2px_0px_0px_#000]">
                <div className="flex items-center gap-1">
                  <Thermometer className="h-3.5 w-3.5" />
                  <span>{m.min_temperature}° - {m.max_temperature}°C</span>
                </div>
                <div className="flex items-center gap-1">
                  <Droplets className="h-3.5 w-3.5" />
                  <span>{m.min_humidity}% - {m.max_humidity}%</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t-2 border-black/10 flex justify-end">
              <button
                onClick={() => handleDelete(m.id, m.name)}
                className="p-1.5 bg-[#fca5a5] text-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
                title="Delete Medicine"
              >
                <Trash2 className="h-4 w-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Medicine Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Pharmaceutical Item">
        <form onSubmit={handleCreate} className="space-y-4 text-xs text-black">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-black uppercase block mb-1">Brand Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Paracetamol 500mg"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full p-2 border-2 border-black rounded-lg font-bold bg-white"
              />
            </div>
            <div>
              <label className="font-black uppercase block mb-1">Generic Formulation</label>
              <input
                type="text"
                placeholder="e.g. Acetaminophen"
                value={form.generic_name}
                onChange={(e) => setForm({ ...form, generic_name: e.target.value })}
                className="w-full p-2 border-2 border-black rounded-lg font-bold bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-black uppercase block mb-1">Manufacturer</label>
              <input
                type="text"
                placeholder="e.g. GlaxoSmithKline"
                value={form.manufacturer}
                onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                className="w-full p-2 border-2 border-black rounded-lg font-bold bg-white"
              />
            </div>
            <div>
              <label className="font-black uppercase block mb-1">Category</label>
              <input
                type="text"
                placeholder="e.g. Analgesic"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full p-2 border-2 border-black rounded-lg font-bold bg-white"
              />
            </div>
            <div>
              <label className="font-black uppercase block mb-1">Dosage Form</label>
              <select
                value={form.form}
                onChange={(e) => setForm({ ...form, form: e.target.value })}
                className="w-full p-2 border-2 border-black rounded-lg font-bold bg-white"
              >
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup</option>
                <option value="Injection">Injection</option>
                <option value="Cream">Cream / Ointment</option>
                <option value="Drops">Eye/Ear Drops</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-black uppercase block mb-1">Dosage Spec</label>
              <input
                type="text"
                placeholder="e.g. 500mg, 10ml"
                value={form.dosage}
                onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                className="w-full p-2 border-2 border-black rounded-lg font-bold bg-white"
              />
            </div>
            <div>
              <label className="font-black uppercase block mb-1">Reorder Level Threshold</label>
              <input
                type="number"
                min="1"
                value={form.reorder_level}
                onChange={(e) => setForm({ ...form, reorder_level: parseInt(e.target.value) || 10 })}
                className="w-full p-2 border-2 border-black rounded-lg font-bold bg-white"
              />
            </div>
          </div>

          <div className="p-3 bg-[#fef08a] border-2 border-black rounded-xl space-y-2 shadow-[2px_2px_0px_0px_#000]">
            <span className="font-black text-black block text-[11px] uppercase tracking-wider">
              Cold Chain Storage Boundaries (DHT22 Trigger Specs)
            </span>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] text-black font-black uppercase block">Min Temp (°C)</label>
                <input
                  type="number"
                  step="0.5"
                  value={form.min_temperature}
                  onChange={(e) => setForm({ ...form, min_temperature: parseFloat(e.target.value) })}
                  className="w-full p-1.5 border-2 border-black rounded bg-white font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-black font-black uppercase block">Max Temp (°C)</label>
                <input
                  type="number"
                  step="0.5"
                  value={form.max_temperature}
                  onChange={(e) => setForm({ ...form, max_temperature: parseFloat(e.target.value) })}
                  className="w-full p-1.5 border-2 border-black rounded bg-white font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-black font-black uppercase block">Min Hum (%)</label>
                <input
                  type="number"
                  step="1"
                  value={form.min_humidity}
                  onChange={(e) => setForm({ ...form, min_humidity: parseFloat(e.target.value) })}
                  className="w-full p-1.5 border-2 border-black rounded bg-white font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-black font-black uppercase block">Max Hum (%)</label>
                <input
                  type="number"
                  step="1"
                  value={form.max_humidity}
                  onChange={(e) => setForm({ ...form, max_humidity: parseFloat(e.target.value) })}
                  className="w-full p-1.5 border-2 border-black rounded bg-white font-bold"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t-2 border-black">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border-2 border-black text-black rounded-xl hover:bg-slate-100 font-black uppercase shadow-[2px_2px_0px_0px_#000]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#86efac] text-black border-2 border-black rounded-xl font-black uppercase shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
            >
              {saving ? "Registering..." : "Register Medicine"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
