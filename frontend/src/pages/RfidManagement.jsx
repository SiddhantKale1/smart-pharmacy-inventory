import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Radio, Plus, Printer, RefreshCw, CheckCircle2, ScanLine } from 'lucide-react';
import { api } from '../services/api';
import Badge from '../components/Badge';

export default function RfidManagement() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTags = async () => {
    try {
      setLoading(true);
      const data = await api.getRfidTags();
      setTags(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-black uppercase tracking-tight">RFID Tag Management</h2>
          <p className="text-xs font-bold text-black/70 mt-0.5">Physical RFID UID chip registry linked to medicine batches and point-of-sale checkout.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/rfid/assign"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#86efac] text-black text-xs font-black uppercase rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
          >
            <ScanLine className="h-4 w-4 stroke-[2.5]" />
            Assign New Tag
          </Link>
          <button
            onClick={loadTags}
            className="p-2 border-2 border-black bg-white rounded-xl text-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
            title="Refresh tags"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tags Table */}
      <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#fde047] border-b-2 border-black text-black font-black uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">RFID UID (Hex)</th>
                <th className="py-3 px-4">Linked Medicine</th>
                <th className="py-3 px-4">Batch #</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned At</th>
                <th className="py-3 px-4">Label Printed</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/10 text-black">
              {loading && tags.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-black font-black">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-black" />
                    LOADING RFID TAGS...
                  </td>
                </tr>
              ) : tags.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-black/70 font-bold">
                    No RFID tags in database. Tap a card on RC522 or click "Assign New Tag".
                  </td>
                </tr>
              ) : (
                tags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-[#fff9db] transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-black text-black bg-[#fed7aa] px-2.5 py-1 rounded-md border-2 border-black text-xs shadow-[1px_1px_0px_0px_#000]">
                        {tag.uid}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-black">
                      {tag.medicine_name || <span className="text-black/50 italic font-bold">Unassigned</span>}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-black">
                      {tag.batch_number || "—"}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-black">
                      {tag.expiry_date || "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={tag.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-black/70 font-mono font-bold text-[11px]">
                      {tag.assigned_at ? tag.assigned_at.split('T')[0] : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-[11px]">
                      {tag.printed_at ? (
                        <span className="text-black font-black flex items-center gap-1 bg-[#86efac] px-1.5 py-0.5 rounded border border-black inline-block">
                          <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" /> Printed
                        </span>
                      ) : (
                        <span className="text-black/50 font-bold">Pending</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {tag.medicine_id && (
                        <Link
                          to={`/rfid/print?tag_id=${tag.id}&uid=${tag.uid}&medicine_id=${tag.medicine_id}&batch_id=${tag.batch_id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-white border-2 border-black rounded-lg text-black hover:bg-[#fef08a] transition text-[11px] font-black uppercase shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5"
                        >
                          <Printer className="h-3.5 w-3.5 stroke-[2.5]" /> Print Label
                        </Link>
                      )}
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
