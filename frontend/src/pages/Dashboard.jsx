import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  Layers,
  Pill,
  AlertTriangle,
  Clock,
  Skull,
  Bell,
  Thermometer,
  Droplets,
  Radio,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '../services/api';
import { StatCard, Card } from '../components/Card';
import Badge from '../components/Badge';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard();
      setData(res);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-black font-black text-sm bg-[#fef08a] px-4 py-3 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000]">
          <RefreshCw className="h-5 w-5 animate-spin" />
          LOADING PHARMACY METRICS...
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const chartData = data?.sensor_chart || [];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome - Neobrutalism Electric Yellow */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#fef08a] p-6 rounded-2xl border-3 border-black shadow-[6px_6px_0px_0px_#000] text-black">
        <div>
          <span className="bg-black text-white font-black text-[10px] uppercase px-2 py-0.5 rounded tracking-widest inline-block mb-1">
            IoT Smart Pharmacy Gateway
          </span>
          <h2 className="text-2xl font-black tracking-tight uppercase leading-none mt-1">
            Pharmacy Telemetry & Operations Command
          </h2>
          <p className="text-black/80 font-bold text-xs mt-1.5 max-w-xl">
            Real-time ESP32 RFID inventory sync, cold-chain DHT22 monitoring, and automated 30-day expiry defense.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={loadData}
            className="flex items-center gap-2 bg-white text-black font-black text-xs px-3.5 py-2 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition uppercase"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sync Now
          </button>
          <Link
            to="/sales"
            className="flex items-center gap-2 bg-[#86efac] text-black font-black text-xs px-4 py-2 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition uppercase"
          >
            <Radio className="h-3.5 w-3.5 stroke-[2.5]" />
            Sales Terminal
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#fca5a5] border-2 border-black text-black rounded-xl text-xs font-black shadow-[4px_4px_0px_0px_#000]">
          Error loading dashboard data: {error}
        </div>
      )}

      {/* Primary KPI Cards Grid (Vibrant Neobrutalism without purple/blue) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Medicines"
          value={kpis.total_medicines ?? 0}
          subtext="Catalog items"
          icon={Pill}
          color="lime"
        />
        <StatCard
          label="Total Batches"
          value={kpis.total_batches ?? 0}
          subtext="Active in storage"
          icon={Layers}
          color="orange"
        />
        <StatCard
          label="Inventory Units"
          value={kpis.total_inventory_units ?? 0}
          subtext="Total unit stock"
          icon={Boxes}
          color="yellow"
        />
        <StatCard
          label="Low Stock Items"
          value={kpis.low_stock_count ?? 0}
          subtext="At or below reorder"
          icon={AlertTriangle}
          color={kpis.low_stock_count > 0 ? "orange" : "lime"}
          statusBadge={kpis.low_stock_count > 0 ? <Badge status="LOW STOCK" size="sm" /> : null}
        />
        <StatCard
          label="Expiring Soon"
          value={kpis.expiring_soon_count ?? 0}
          subtext="Within 30 days"
          icon={Clock}
          color={kpis.expiring_soon_count > 0 ? "yellow" : "lime"}
          statusBadge={kpis.expiring_soon_count > 0 ? <Badge status="EXPIRING SOON" size="sm" /> : null}
        />
      </div>

      {/* Secondary Quick Status Grid (Cold Chain & Expiry) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Expired Stock Card */}
        <div className="bg-white p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg border-2 border-black ${kpis.expired_count > 0 ? 'bg-[#f87171]' : 'bg-slate-100'}`}>
              <Skull className="h-5 w-5 text-black" />
            </div>
            <div>
              <p className="text-[11px] text-black font-black uppercase">Expired Batches</p>
              <p className={`text-xl font-black ${kpis.expired_count > 0 ? 'text-black' : 'text-black'}`}>
                {kpis.expired_count} Batches
              </p>
            </div>
          </div>
          {kpis.expired_count > 0 && <Badge status="EXPIRED" size="sm" />}
        </div>

        {/* Current Temperature Card */}
        <div className="bg-[#bbf7d0] p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-black text-white border border-black">
              <Thermometer className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] text-black font-black uppercase">DHT22 Temp</p>
              <p className="text-xl font-black text-black">{kpis.current_temperature?.toFixed(1) ?? '--'} °C</p>
            </div>
          </div>
          <Badge status={kpis.temperature_status || "NORMAL"} size="sm" />
        </div>

        {/* Current Humidity Card (Tangerine / Orange, NO blue) */}
        <div className="bg-[#fed7aa] p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-black text-white border border-black">
              <Droplets className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] text-black font-black uppercase">DHT22 Humidity</p>
              <p className="text-xl font-black text-black">{kpis.current_humidity?.toFixed(1) ?? '--'} %</p>
            </div>
          </div>
          <Badge status={kpis.humidity_status || "NORMAL"} size="sm" />
        </div>

        {/* ThingSpeak Telemetry Card (Lime / Green, NO purple) */}
        <div className="bg-[#fef08a] p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-black text-white border border-black">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] text-black font-black uppercase">ThingSpeak Channel</p>
              <p className="text-xs font-mono font-black text-black">
                {data?.thingspeak?.channel_id || "Active"}
              </p>
            </div>
          </div>
          <Badge status={data?.thingspeak?.status || "ONLINE"} size="sm" />
        </div>
      </div>

      {/* Middle Row: Climate Telemetry Charts (Neobrutalism high-contrast) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature Graph */}
        <Card
          title="DHT22 Storage Temperature (°C)"
          subtitle="Real-time ESP32 DevKit telemetry"
          icon={Thermometer}
          headerBg="bg-[#bbf7d0]"
          action={
            <span className="text-xs font-mono text-black font-black bg-white px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_#000]">
              Ideal: 15°C - 25°C
            </span>
          }
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTempNeo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#86efac" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#86efac" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" stroke="#000" strokeOpacity={0.2} />
                <XAxis dataKey="timestamp" tick={{ fontSize: 10, fill: '#000', fontWeight: 'bold' }} stroke="#000" />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#000', fontWeight: 'bold' }} stroke="#000" unit="°C" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '2px solid #000', boxShadow: '3px 3px 0px 0px #000', color: '#000', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="temperature" stroke="#000" strokeWidth={3} fillOpacity={1} fill="url(#colorTempNeo)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Humidity Graph (Tangerine / Orange, NO blue) */}
        <Card
          title="Storage Humidity Trend (%)"
          subtitle="Monitored against clinical humidity boundaries"
          icon={Droplets}
          headerBg="bg-[#fed7aa]"
          action={
            <span className="text-xs font-mono text-black font-black bg-white px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_#000]">
              Safe: 30% - 65%
            </span>
          }
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorHumNeo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb923c" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" stroke="#000" strokeOpacity={0.2} />
                <XAxis dataKey="timestamp" tick={{ fontSize: 10, fill: '#000', fontWeight: 'bold' }} stroke="#000" />
                <YAxis domain={[20, 100]} tick={{ fontSize: 10, fill: '#000', fontWeight: 'bold' }} stroke="#000" unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '2px solid #000', boxShadow: '3px 3px 0px 0px #000', color: '#000', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="humidity" stroke="#000" strokeWidth={3} fillOpacity={1} fill="url(#colorHumNeo)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Bottom Row: Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Alerts */}
        <Card
          title="Active Expiry & Climate Alerts"
          subtitle="Deduplicated notifications"
          icon={Bell}
          headerBg="bg-[#fde047]"
          action={
            <Link to="/alerts" className="text-xs font-black text-black hover:underline flex items-center gap-1 uppercase">
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {data?.recent_alerts?.length === 0 ? (
            <div className="text-center py-8 text-black/50 font-bold text-xs">No active alerts. All systems normal.</div>
          ) : (
            <div className="space-y-2.5">
              {data?.recent_alerts?.map((a) => (
                <div key={a.id} className="p-3 rounded-lg border-2 border-black bg-[#fffdf5] shadow-[2px_2px_0px_0px_#000] flex items-start gap-2.5">
                  <div className="mt-0.5">
                    <Badge status={a.severity} size="sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-black line-clamp-2">{a.message}</p>
                    <span className="text-[10px] text-black/60 font-mono block mt-1">{a.created_at}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent RFID Transactions */}
        <Card
          title="Recent RFID Transactions"
          subtitle="Point-of-Sale deductions"
          icon={Radio}
          headerBg="bg-[#86efac]"
          action={
            <Link to="/transactions" className="text-xs font-black text-black hover:underline flex items-center gap-1 uppercase">
              Audit Log <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {data?.recent_transactions?.length === 0 ? (
            <div className="text-center py-8 text-black/50 font-bold text-xs">No transactions recorded yet.</div>
          ) : (
            <div className="space-y-2">
              {data?.recent_transactions?.slice(0, 5).map((tx) => (
                <div key={tx.id} className="p-2.5 rounded-lg border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Badge status={tx.transaction_type} size="sm" />
                    <div>
                      <span className="font-black text-black">{tx.medicine_name}</span>
                      <span className="text-[10px] text-black/70 font-mono block">UID: {tx.rfid_uid || 'Manual'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-black">{tx.quantity > 0 ? `-${tx.quantity}` : tx.quantity}</span>
                    <span className="text-[10px] text-black/60 font-mono block">{tx.created_at?.split(' ')[1]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Supplier Invoices */}
        <Card
          title="Supplier Invoices"
          subtitle="Verification Queue"
          icon={Boxes}
          headerBg="bg-[#fed7aa]"
          action={
            <Link to="/invoices" className="text-xs font-black text-black hover:underline flex items-center gap-1 uppercase">
              Verify Invoices <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {data?.recent_invoices?.length === 0 ? (
            <div className="text-center py-8 text-black/50 font-bold text-xs">No supplier invoices found.</div>
          ) : (
            <div className="space-y-2.5">
              {data?.recent_invoices?.map((inv) => (
                <div key={inv.id} className="p-3 rounded-lg border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-black text-black">#{inv.invoice_number}</span>
                    <span className="text-[11px] font-bold text-black/70 block">{inv.supplier_name}</span>
                  </div>
                  <div className="text-right">
                    <Badge status={inv.import_status} size="sm" />
                    <span className="text-[10px] font-mono text-black/60 block mt-1">{inv.invoice_date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
