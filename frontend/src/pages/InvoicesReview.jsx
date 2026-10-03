import React, { useState, useEffect } from 'react';
import { FileCheck2, Upload, CheckCircle2, AlertCircle, Edit2, ArrowRight, RefreshCw, FileText, Check } from 'lucide-react';
import { api } from '../services/api';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

export default function InvoicesReview() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [reviewItems, setReviewItems] = useState([]);
  const [supplierName, setSupplierName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await api.getInvoices();
      setInvoices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const openReviewModal = async (invId) => {
    try {
      const inv = await api.getInvoice(invId);
      setSelectedInvoice(inv);
      setSupplierName(inv.supplier_name);
      setInvoiceNumber(inv.invoice_number);
      setInvoiceDate(inv.invoice_date);
      setReviewItems(inv.items.map(item => ({ ...item })));
      setIsReviewOpen(true);
    } catch (err) {
      alert("Failed to load invoice: " + err.message);
    }
  };

  const handleItemFieldChange = (index, field, value) => {
    const updated = [...reviewItems];
    updated[index][field] = value;
    setReviewItems(updated);
  };

  const handleConfirmAndImport = async () => {
    if (!window.confirm("Verify and commit this invoice into PostgreSQL? Medicines and batches will be updated and restock transactions logged.")) {
      return;
    }

    try {
      setConfirming(true);
      await api.confirmInvoice(selectedInvoice.id, {
        invoice_number: invoiceNumber,
        supplier_name: supplierName,
        invoice_date: invoiceDate,
        items: reviewItems.map(it => ({
          medicine_name: it.medicine_name,
          generic_name: it.generic_name || it.medicine_name,
          manufacturer: it.manufacturer,
          batch_number: it.batch_number,
          expiry_date: it.expiry_date,
          quantity: parseInt(it.quantity) || 1,
          dosage: it.dosage || "500mg",
          form: it.form || "Tablet",
          min_temperature: parseFloat(it.min_temperature) || 15.0,
          max_temperature: parseFloat(it.max_temperature) || 25.0,
          min_humidity: parseFloat(it.min_humidity) || 30.0,
          max_humidity: parseFloat(it.max_humidity) || 65.0,
          reorder_level: parseInt(it.reorder_level) || 10
        }))
      });

      alert(`Invoice #${invoiceNumber} successfully confirmed and added to PostgreSQL inventory!`);
      setIsReviewOpen(false);
      loadInvoices();
    } catch (err) {
      alert("Confirmation Error: " + err.message);
    } finally {
      setConfirming(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const res = await api.uploadInvoice(file);
      alert(res.message);
      loadInvoices();
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-black uppercase tracking-tight">Invoice Review & Verification Queue</h2>
          <p className="text-xs font-bold text-black/70 mt-0.5">
            Strict human-in-the-loop verification screen. Review extracted invoice items before committing to PostgreSQL.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Fallback CSV Upload */}
          <label className="flex items-center gap-1.5 px-3.5 py-2 bg-[#86efac] text-black text-xs font-black uppercase rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] cursor-pointer hover:translate-x-0.5 hover:translate-y-0.5 transition">
            <Upload className="h-4 w-4 stroke-[2.5]" />
            <span>{uploading ? "Parsing File..." : "Upload Fallback CSV/File"}</span>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={loadInvoices}
            className="p-2 border-2 border-black bg-white rounded-xl text-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
            title="Refresh Invoices"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Safety Banner */}
      <div className="p-4 rounded-xl bg-[#fef08a] border-2 border-black text-black text-xs flex items-start gap-3 shadow-[4px_4px_0px_0px_#000]">
        <AlertCircle className="h-5 w-5 text-black shrink-0 mt-0.5 stroke-[2.5]" />
        <div className="space-y-1">
          <p className="font-black uppercase">Important Pharmaceutical Business Rule:</p>
          <p className="font-bold leading-relaxed">
            Parsed email and invoice attachments are <b>never automatically trusted</b>. Pharmacy staff must review line items, verify expiration dates, confirm quantities, and click "Verify & Commit to PostgreSQL".
          </p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#fde047] border-b-2 border-black text-black font-black uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Supplier Name</th>
                <th className="py-3 px-4">Invoice Date</th>
                <th className="py-3 px-4">Line Items</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Import Timestamp</th>
                <th className="py-3 px-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/10 text-black">
              {loading && invoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-black font-black">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                    LOADING INVOICES...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-black/70 font-bold">
                    No supplier invoices staged. Check "Email Ingestion" to fetch new emails.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#fff9db] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-black">
                      #{inv.invoice_number}
                    </td>
                    <td className="py-3.5 px-4 font-black text-black">
                      {inv.supplier_name || "Supplier"}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-black">
                      {inv.invoice_date || "—"}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold">
                      {inv.item_count} items
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={inv.import_status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-black/70 text-[11px] font-bold">
                      {inv.created_at?.split('T')[0]}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {inv.import_status === "PENDING_REVIEW" ? (
                        <button
                          onClick={() => openReviewModal(inv.id)}
                          className="px-3.5 py-1.5 bg-[#86efac] text-black border-2 border-black rounded-lg text-[11px] font-black uppercase shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition inline-flex items-center gap-1.5"
                        >
                          <Edit2 className="h-3 w-3 stroke-[2.5]" />
                          Review & Verify
                        </button>
                      ) : (
                        <button
                          onClick={() => openReviewModal(inv.id)}
                          className="px-2.5 py-1 text-black font-black uppercase rounded-lg text-[11px] border-2 border-black bg-white hover:bg-slate-50 transition shadow-[1px_1px_0px_0px_#000]"
                        >
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Edit Modal */}
      <Modal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        title={`Pharmacist Verification Screen - Invoice #${invoiceNumber}`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-5 text-xs text-black">
          {/* Header Info */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-[#fef08a] border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_#000]">
            <div>
              <label className="text-[10px] text-black font-black uppercase block">Invoice Number</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full p-1.5 border-2 border-black rounded font-mono font-black bg-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-black font-black uppercase block">Supplier</label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full p-1.5 border-2 border-black rounded font-black bg-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-black font-black uppercase block">Invoice Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full p-1.5 border-2 border-black rounded font-mono font-bold bg-white"
              />
            </div>
          </div>

          {/* Line Items Table with Inline Editing */}
          <div>
            <h4 className="font-black text-black text-xs mb-2 uppercase tracking-wider">
              Verify & Edit Extracted Line Items:
            </h4>
            <div className="border-2 border-black rounded-xl overflow-hidden shadow-[3px_3px_0px_0px_#000]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#fde047] text-black font-black text-[10px] uppercase border-b-2 border-black">
                  <tr>
                    <th className="p-2.5">Medicine Name</th>
                    <th className="p-2.5">Manufacturer</th>
                    <th className="p-2.5">Batch Number</th>
                    <th className="p-2.5">Expiry Date</th>
                    <th className="p-2.5">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 bg-white">
                  {reviewItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.medicine_name}
                          onChange={(e) => handleItemFieldChange(idx, 'medicine_name', e.target.value)}
                          className="w-full p-1.5 border-2 border-black rounded font-black text-black"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.manufacturer}
                          onChange={(e) => handleItemFieldChange(idx, 'manufacturer', e.target.value)}
                          className="w-full p-1.5 border-2 border-black rounded font-bold text-black"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.batch_number}
                          onChange={(e) => handleItemFieldChange(idx, 'batch_number', e.target.value)}
                          className="w-full p-1.5 border-2 border-black rounded font-mono font-black text-black"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="date"
                          value={item.expiry_date}
                          onChange={(e) => handleItemFieldChange(idx, 'expiry_date', e.target.value)}
                          className="w-full p-1.5 border-2 border-black rounded font-mono font-black text-black"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemFieldChange(idx, 'quantity', e.target.value)}
                          className="w-20 p-1.5 border-2 border-black rounded font-black text-black text-center"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center pt-3 border-t-2 border-black">
            <span className="text-[11px] text-black/70 font-mono font-bold">
              PostgreSQL will create/update medicines, batches, and RESTOCK ledger logs.
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsReviewOpen(false)}
                className="px-4 py-2 border-2 border-black text-black rounded-xl hover:bg-slate-100 font-black uppercase text-xs shadow-[2px_2px_0px_0px_#000]"
              >
                Cancel
              </button>
              {selectedInvoice?.import_status === "PENDING_REVIEW" && (
                <button
                  type="button"
                  onClick={handleConfirmAndImport}
                  disabled={confirming}
                  className="px-5 py-2 bg-[#86efac] text-black border-2 border-black rounded-xl font-black uppercase text-xs shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                  {confirming ? "Committing..." : "Verify & Commit to PostgreSQL"}
                </button>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
