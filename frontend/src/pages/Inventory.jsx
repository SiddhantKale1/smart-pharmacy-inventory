import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  Search,
  Filter,
  RefreshCw,
  Radio,
  Printer,
  AlertTriangle,
  Clock,
  Skull,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import Badge from '../components/Badge';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await api.getInventory(statusFilter, search);
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadInventory();
  };

  const statusTabs = [
    { label: "All Items", value: "" },
    { label: "In Stock", value: "IN STOCK" },
    { label: "Low Stock", value: "LOW STOCK" },
    { label: "Expiring Soon", value: "EXPIRING SOON" },
    { label: "Expired", value: "EXPIRED" },
    { label: "Out of Stock", value: "OUT OF STOCK" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-black uppercase tracking-tight">Clinical Medicine Inventory</h2>
          <p className="text-xs font-bold text-black/70 mt-0.5">PostgreSQL ledger synchronized with physical RFID mappings & DHT22 cold-chain conditions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/rfid/assign"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#86efac] text-black text-xs font-black uppercase rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
          >
            <Radio className="h-3.5 w-3.5 stroke-[2.5]" />
            Assign RFID Tag
          </Link>
          <button
            onClick={loadInventory}
            className="p-2 bg-white border-2 border-black rounded-xl text-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
            title="Refresh Inventory"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-[#fef08a] p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 text-xs font-black uppercase rounded-lg border-2 border-black transition ${
                  statusFilter === tab.value
                    ? 'bg-black text-white shadow-[2px_2px_0px_0px_#fff]'
                    : 'bg-white text-black hover:bg-[#86efac] shadow-[2px_2px_0px_0px_#000]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative min-w-[280px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-black" />
            <input
              type="text"
              placeholder="Search medicine, batch, RFID UID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border-2 border-black rounded-lg text-xs font-bold text-black focus:outline-none shadow-[2px_2px_0px_0px_#000]"
            />
          </form>
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#fde047] border-b-2 border-black text-black font-black uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Medicine Details</th>
                <th className="py-3 px-4">Batch #</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Remaining / Recv</th>
                <th className="py-3 px-4">Reorder</th>
                <th className="py-3 px-4">RFID UID</th>
                <th className="py-3 px-4">Climate Spec</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/10 text-black">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 font-black text-black">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-black" />
                    FETCHING INVENTORY RECORDS...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 font-bold text-black/70">
                    No medicine inventory records found matching criteria.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.batch_id} className="hover:bg-[#fff9db] transition-colors">
                    {/* Medicine */}
                    <td className="py-3.5 px-4">
                      <div className="font-black text-black text-xs">{item.medicine_name}</div>
                      <div className="text-[10px] text-black/70 font-bold">{item.manufacturer || "Standard Pharma"}</div>
                    </td>

                    {/* Batch */}
                    <td className="py-3.5 px-4 font-mono font-black text-black">
                      {item.batch_number}
                    </td>

                    {/* Expiry */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-black">{item.expiry_date}</div>
                      <div className="text-[10px]">
                        {item.days_until_expiry < 0 ? (
                          <span className="text-black bg-[#f87171] px-1 rounded font-black border border-black inline-block mt-0.5">
                            EXPIRED ({Math.abs(item.days_until_expiry)}d ago)
                          </span>
                        ) : item.days_until_expiry <= 30 ? (
                          <span className="text-black bg-[#fde047] px-1 rounded font-black border border-black inline-block mt-0.5">
                            {item.days_until_expiry} days left
                          </span>
                        ) : (
                          <span className="text-black/70 font-semibold">{item.days_until_expiry} days left</span>
                        )}
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-baseline gap-1">
                        <span className="font-black text-base text-black">
                          {item.quantity_remaining}
                        </span>
                        <span className="text-black/60 text-[10px] font-bold">/ {item.quantity_received}</span>
                      </div>
                    </td>

                    {/* Reorder Level */}
                    <td className="py-3.5 px-4 font-mono font-bold text-black">
                      {item.reorder_level}
                    </td>

                    {/* RFID Status & UID */}
                    <td className="py-3.5 px-4">
                      {item.rfid_assigned ? (
                        <div>
                          <span className="font-mono text-[11px] font-black text-black bg-[#86efac] px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_#000] inline-block">
                            {item.rfid_uid}
                          </span>
                        </div>
                      ) : (
                        <span className="text-black/50 font-bold italic text-[11px]">Unassigned</span>
                      )}
                    </td>

                    {/* Storage Condition */}
                    <td className="py-3.5 px-4 text-[10px] font-bold text-black">
                      <div>Temp: <b>{item.min_temperature}° - {item.max_temperature}°C</b></div>
                      <div>Hum: <b>{item.min_humidity}% - {item.max_humidity}%</b></div>
                    </td>

                    {/* Inventory Status */}
                    <td className="py-3.5 px-4 text-center">
                      <Badge status={item.inventory_status} size="sm" />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/rfid/print?medicine_id=${item.medicine_id}&batch_id=${item.batch_id}`}
                          className="p-1.5 rounded-lg border-2 border-black bg-white hover:bg-[#fef08a] text-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
                          title="Print RFID Label"
                        >
                          <Printer className="h-3.5 w-3.5 stroke-[2.5]" />
                        </Link>
                        {!item.rfid_assigned && (
                          <Link
                            to={`/rfid/assign?batch_id=${item.batch_id}&medicine_id=${item.medicine_id}`}
                            className="px-2 py-1 bg-[#86efac] text-black text-[10px] font-black uppercase rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
                          >
                            Assign Tag
                          </Link>
                        )}
                      </div>
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
