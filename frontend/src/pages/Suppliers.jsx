import React, { useState, useEffect } from 'react';
import { Truck, Plus, Trash2, Mail, Phone, MapPin, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import Modal from '../components/Modal';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: ''
  });

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await api.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.createSupplier(form);
      setIsModalOpen(false);
      setForm({ name: '', contact_person: '', email: '', phone: '', address: '' });
      loadSuppliers();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete supplier ${name}?`)) return;
    try {
      await api.deleteSupplier(id);
      loadSuppliers();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-black uppercase tracking-tight">Pharmaceutical Suppliers</h2>
          <p className="text-xs font-bold text-black/70 mt-0.5">Authorized pharmaceutical distributors, logistics contacts, and invoice providers.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#86efac] text-black text-xs font-black uppercase rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          Add Supplier
        </button>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && suppliers.length === 0 ? (
          <div className="col-span-full py-16 text-center text-black font-black text-xs">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-black" />
            LOADING SUPPLIERS DIRECTORY...
          </div>
        ) : suppliers.map((s) => (
          <div key={s.id} className="bg-white p-5 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between space-y-4 hover:translate-x-0.5 hover:translate-y-0.5 transition">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-black text-black text-base uppercase">{s.name}</h3>
                  <p className="text-xs font-bold text-black/70 mt-0.5">Contact: {s.contact_person || "Logistics Lead"}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-[#fef08a] border-2 border-black text-black shadow-[2px_2px_0px_0px_#000]">
                  <Truck className="h-5 w-5 stroke-[2.5]" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t-2 border-black/10 space-y-2 text-xs font-bold text-black">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-black" />
                  <span className="truncate">{s.email || "orders@supplier.com"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-black" />
                  <span>{s.phone || "+1 (800) 555-0100"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-black shrink-0" />
                  <span className="truncate">{s.address || "Pharma Distribution Hub"}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t-2 border-black/10 flex justify-end">
              <button
                onClick={() => handleDelete(s.id, s.name)}
                className="p-1.5 bg-[#fca5a5] text-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
                title="Delete Supplier"
              >
                <Trash2 className="h-4 w-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Supplier Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Supplier">
        <form onSubmit={handleCreate} className="space-y-4 text-xs text-black">
          <div>
            <label className="font-black uppercase block mb-1">Company / Supplier Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. MedSupply Global Ltd"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-2 border-2 border-black rounded-lg font-bold bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-black uppercase block mb-1">Contact Person</label>
              <input
                type="text"
                placeholder="e.g. David Vance"
                value={form.contact_person}
                onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                className="w-full p-2 border-2 border-black rounded-lg font-bold bg-white"
              />
            </div>
            <div>
              <label className="font-black uppercase block mb-1">Email Address</label>
              <input
                type="email"
                placeholder="e.g. orders@supplier.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full p-2 border-2 border-black rounded-lg font-bold bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-black uppercase block mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="e.g. +1-800-555-0144"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full p-2 border-2 border-black rounded-lg font-bold bg-white"
              />
            </div>
            <div>
              <label className="font-black uppercase block mb-1">Facility Address</label>
              <input
                type="text"
                placeholder="e.g. 44 Distribution Blvd"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full p-2 border-2 border-black rounded-lg font-bold bg-white"
              />
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
              {saving ? "Registering..." : "Add Supplier"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
