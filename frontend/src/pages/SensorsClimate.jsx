import React, { useState, useEffect } from 'react';
import { Thermometer, Droplets, RefreshCw, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '../services/api';
import Badge from '../components/Badge';
import { Card } from '../components/Card';

export default function SensorsClimate() {
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [latest, hist] = await Promise.all([
        api.getSensorLatest(),
        api.getSensorHistory(30)
      ]);
      setStatus(latest);
      setHistory(hist.map(r => ({
        id: r.id,
        timestamp: new Date(r.created_at).toLocaleTimeString(),
        temperature: r.temperature,
        humidity: r.humidity
      })).reverse());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-black uppercase tracking-tight">Cold-Chain & Environment Monitoring</h2>
          <p className="text-xs font-bold text-black/70 mt-0.5">Real-time DHT22 temperature and relative humidity tracking for medicine stability.</p>
        </div>
        <button
          onClick={loadData}
          className="p-2 border-2 border-black bg-white rounded-xl text-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
          title="Refresh telemetry"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Primary Climate Gauges (Lime & Tangerine - NO blue/purple) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Temperature Gauge Card */}
        <div className="bg-[#bbf7d0] p-6 rounded-2xl border-3 border-black shadow-[6px_6px_0px_0px_#000] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-3 bg-black text-white rounded-xl border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                <Thermometer className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-black text-black text-base uppercase">Storage Temperature</h3>
                <p className="text-xs font-bold text-black/70 font-mono">DHT22 Probe (GPIO 27)</p>
              </div>
            </div>
            <Badge status={status?.temperature_status || "NORMAL"} />
          </div>

          <div className="my-6 text-center">
            <div className="text-6xl font-black text-black tracking-tight">
              {status?.current_temperature?.toFixed(1) ?? '--'}<span className="text-3xl font-black text-black/70 ml-1">°C</span>
            </div>
            <p className="text-xs font-black text-black uppercase mt-1">
              Permitted Range: <span className="bg-white px-2 py-0.5 rounded border border-black font-mono">15.0°C - 25.0°C</span>
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white border-2 border-black text-xs font-black text-black flex items-center justify-between shadow-[2px_2px_0px_0px_#000]">
            <span className="uppercase">Overall Climate Status:</span>
            <span className="bg-[#86efac] px-2 py-0.5 rounded border border-black">{status?.overall_status}</span>
          </div>
        </div>

        {/* Humidity Gauge Card (Tangerine / Orange - NO blue) */}
        <div className="bg-[#fed7aa] p-6 rounded-2xl border-3 border-black shadow-[6px_6px_0px_0px_#000] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-3 bg-black text-white rounded-xl border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                <Droplets className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-black text-black text-base uppercase">Relative Humidity</h3>
                <p className="text-xs font-bold text-black/70 font-mono">DHT22 Digital Out (GPIO 27)</p>
              </div>
            </div>
            <Badge status={status?.humidity_status || "NORMAL"} />
          </div>

          <div className="my-6 text-center">
            <div className="text-6xl font-black text-black tracking-tight">
              {status?.current_humidity?.toFixed(1) ?? '--'}<span className="text-3xl font-black text-black/70 ml-1">%</span>
            </div>
            <p className="text-xs font-black text-black uppercase mt-1">
              Permitted Range: <span className="bg-white px-2 py-0.5 rounded border border-black font-mono">30.0% - 65.0%</span>
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white border-2 border-black text-xs font-black text-black flex items-center justify-between shadow-[2px_2px_0px_0px_#000]">
            <span className="uppercase">Active Climate Alerts:</span>
            <span className="bg-[#fde047] px-2 py-0.5 rounded border border-black">{status?.active_climate_alerts ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Historical Telemetry Chart */}
      <Card
        title="Live ESP32 DHT22 Telemetry Stream"
        subtitle="Last 30 recorded temperature & humidity telemetry data points"
        icon={Activity}
        headerBg="bg-[#fef08a]"
      >
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="sensTempNeo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#86efac" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#86efac" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="sensHumNeo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fed7aa" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#fed7aa" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 2" stroke="#000" strokeOpacity={0.2} />
              <XAxis dataKey="timestamp" tick={{ fontSize: 10, fill: '#000', fontWeight: 'bold' }} stroke="#000" />
              <YAxis tick={{ fontSize: 10, fill: '#000', fontWeight: 'bold' }} stroke="#000" />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '2px solid #000', boxShadow: '3px 3px 0px 0px #000', color: '#000', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#000" strokeWidth={3} fillOpacity={1} fill="url(#sensTempNeo)" />
              <Area type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#sensHumNeo)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
