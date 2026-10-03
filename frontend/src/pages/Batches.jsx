import React, { useState, useEffect } from 'react';
import { Layers, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import Modal from '../components/Modal';
import Badge from '../components/Badge';

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    medicine_id: '',
    batch_number: '',
    expiry_date: '',
    quantity_received: 50,
    quantity_remaining: 50,
    invoice_number: '',
    supplier_id: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [bData, mData, sData] = await Promise.all([
        api.getBatches(),
        api.getMedicines(),
        api.getSuppliers()
      ]);
      setBatches(bData);
      setMedicines(mData);
      setSuppliers(sData);
      if (mData.length > 0 && !form.medicine_id) {
        setForm(prev => ({ ...prev, medicine_id: mData[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.createBatch({
        ...form,
        medicine_id: parseInt(form.medicine_id),
        supplier_id: form.supplier_id ? parseInt(form.supplier_id) : null,
        quantity_received: parseInt(form.quantity_received),
        quantity_remaining: parseInt(form.quantity_remaining)
      });
      setIsModalOpen(false);
      setForm({
        medicine_id: medicines[0]?.id || '',
        batch_number: '',
        expiry_date: '',
        quantity_received: 50,
        quantity_remaining: 50,
        invoice_number: '',
        supplier_id: '',
      });
      loadData();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, batchNo) => {
    if (!window.confirm(`Delete batch ${batchNo}?`)) return;
    try {
      await api.deleteBatch(id);
      loadData();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-black uppercase tracking-tight">Batch Management</h2>
          <p className="text-xs font-bold text-black/70 mt-0.5">Track lot/batch receipts, expiration schedules, and remaining stock.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#86efac] text-black text-xs font-black uppercase rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          Receive New Batch
        </button>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#fde047] border-b-2 border-black text-black font-black uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Batch Number</th>
                <th className="py-3 px-4">Medicine</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Stock (Rem / Recv)</th>
                <th className="py-3 px-4">Invoice Ref</th>
                <th className="py-3 px-4">Received Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/10 text-black">
              {loading && batches.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-black font-black">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-black" />
                    LOADING BATCHES...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-black/70 font-bold">
                    No batches recorded yet.
                  </td>
                </tr>
              ) : (
                batches.map((b) => (
                  <tr key={b.id} className="hover:bg-[#fff9db] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-black">
                      {b.batch_number}
                    </td>
                    <td className="py-3.5 px-4 font-black text-black">
                      {b.medicine_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-black">{b.expiry_date}</div>
                      <div className="text-[10px]">
                        {b.days_until_expiry < 0 ? (
                          <span className="text-black bg-[#f87171] px-1 rounded font-black border border-black inline-block mt-0.5">
                            EXPIRED ({Math.abs(b.days_until_expiry)}d ago)
                          </span>
                        ) : b.days_until_expiry <= 30 ? (
                          <span className="text-black bg-[#fde047] px-1 rounded font-black border border-black inline-block mt-0.5">
                            Expires in {b.days_until_expiry} days
                          </span>
                        ) : (
                          <span className="text-black/70 font-bold">{b.days_until_expiry} days left</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-black text-base text-black">
                        {b.quantity_remaining}
                      </span>
                      <span className="text-black/60 text-[10px] font-bold"> / {b.quantity_received}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-black text-[11px] font-bold">
                      {b.invoice_number || "Direct Entry"}
                    </td>
                    <td className="py-3.5 px-4 text-black/70 font-mono text-[11px] font-bold">
                      {b.received_date}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge status={b.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/rfid/assign?batch_id=${b.id}&medicine_id=${b.medicine_id}`}
                          className="px-2.5 py-1 bg-[#86efac] text-black text-[10px] font-black uppercase rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
                        >
                          Tag RFID
                        </Link>
                        <button
                          onClick={() => handleDelete(b.id, b.batch_number)}
                          className="p-1.5 bg-[#fca5a5] text-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
                          title="Delete Batch"
                        >
                          <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Batch Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Receive New Medicine Batch">
        <form onSubmit={handleCreate} className="space-y-4 text-xs text-black">
          <div>
            <label className="font-black uppercase block mb-1">Select Medicine *</label>
            <select
              required
              value={form.medicine_id}
              onChange={(e) => setForm({ ...form, medicine_id: e.target.value })}
              className="w-full p-2 border-2 border-black rounded-lg font-bold bg-white"
            >
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.dosage}, {m.form})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-black uppercase block mb-1">Batch / Lot Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. PCM24081"
                value={form.batch_number}
                onChange={(e) => setForm({ ...form, batch_number: e.target.value })}
                className="w-full p-2 border-2 border-black rounded-lg bg-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-black uppercase block mb-1">Expiry Date *</label>
              <input
                type="date"
                required
                value={form.expiry_date}
                onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                className="w-full p-2 border-2 border-black rounded-lg bg-white font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-black uppercase block mb-1">Quantity Received *</label>
              <input
                type="number"
                min="1"
                required
                value={form.quantity_received}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setForm({ ...form, quantity_received: val, quantity_remaining: val });
                }}
                className="w-full p-2 border-2 border-black rounded-lg font-bold bg-white"
              />
            </div>
            <div>
              <label className="font-black uppercase block mb-1">Quantity Remaining *</label>
              <input
                type="number"
                min="0"
                required
                value={form.quantity_remaining}
                onChange={(e) => setForm({ ...form, quantity_remaining: parseInt(e.target.value) || 0 })}
                className="w-full p-2 border-2 border-black rounded-lg font-bold bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-black uppercase block mb-1">Invoice Number (Optional)</label>
              <input
                type="text"
                placeholder="e.g. INV-2026-091"
                value={form.invoice_number}
                onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                className="w-full p-2 border-2 border-black rounded-lg bg-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-black uppercase block mb-1">Supplier (Optional)</label>
              <select
                value={form.supplier_id}
                onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                className="w-full p-2 border-2 border-black rounded-lg font-bold bg-white"
              >
                <option value="">None / Direct</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
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
              {saving ? "Saving Batch..." : "Commit Batch to Inventory"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
