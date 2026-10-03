import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Thermometer,
  Droplets,
  Bell,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import Badge from './Badge';

export default function Header({ onOpenSimulator }) {
  const [climate, setClimate] = useState(null);
  const [alertCount, setAlertCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchLiveMetrics = async () => {
    try {
      setLoading(true);
      const [climateData, alertsData] = await Promise.all([
        api.getSensorLatest(),
        api.getAlerts(null, null, false)
      ]);
      setClimate(climateData);
      setAlertCount(alertsData.length);
    } catch (e) {
      console.warn("Failed to fetch live header metrics", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveMetrics();
    const interval = setInterval(fetchLiveMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white border-b-2 border-black px-6 flex items-center justify-between sticky top-0 z-20 shadow-[0px_2px_0px_0px_#000] no-print">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="font-black text-black text-sm uppercase tracking-tight">Retail Pharmacy #102</span>
          <span className="text-black font-black">/</span>
          <span className="text-xs font-bold text-black/70 uppercase tracking-wide">Cold-Chain Storage</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Real-time Climate Telemetry Badges (Neobrutalist lime & orange, NO blue/purple) */}
        {climate && (
          <div className="flex items-center gap-2">
            {/* Temp Badge */}
            <div className="flex items-center gap-1.5 bg-[#bbf7d0] border-2 border-black px-2.5 py-1 rounded-lg text-xs font-black shadow-[2px_2px_0px_0px_#000]">
              <Thermometer className="h-3.5 w-3.5 text-black" />
              <span>{climate.current_temperature?.toFixed(1) ?? '--'}°C</span>
              <Badge status={climate.temperature_status} size="sm" />
            </div>

            {/* Humidity Badge (Tangerine / Orange, NOT blue) */}
            <div className="flex items-center gap-1.5 bg-[#fed7aa] border-2 border-black px-2.5 py-1 rounded-lg text-xs font-black shadow-[2px_2px_0px_0px_#000]">
              <Droplets className="h-3.5 w-3.5 text-black" />
              <span>{climate.current_humidity?.toFixed(1) ?? '--'}%</span>
              <Badge status={climate.humidity_status} size="sm" />
            </div>
          </div>
        )}

        {/* Active Alerts Pill */}
        <Link
          to="/alerts"
          className="flex items-center gap-1.5 px-3 py-1 bg-[#fde047] border-2 border-black rounded-lg text-xs font-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
          title="View Active Alerts"
        >
          <Bell className="h-3.5 w-3.5 text-black" />
          <span>ALERTS</span>
          {alertCount > 0 ? (
            <span className="bg-[#f87171] text-black border border-black text-[10px] font-black px-1.5 rounded-full">
              {alertCount}
            </span>
          ) : (
            <span className="text-black text-xs font-black">0</span>
          )}
        </Link>

        {/* Quick Simulator Drawer Trigger */}
        <button
          onClick={onOpenSimulator}
          className="flex items-center gap-1.5 px-3 py-1 bg-[#86efac] border-2 border-black rounded-lg text-black text-xs font-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#000] transition"
          title="Simulate RFID Tap or DHT22 Telemetry"
        >
          <Cpu className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>SIMULATOR</span>
        </button>

        {/* Refresh button */}
        <button
          onClick={fetchLiveMetrics}
          disabled={loading}
          className="p-1.5 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
          title="Refresh telemetry"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  );
}
