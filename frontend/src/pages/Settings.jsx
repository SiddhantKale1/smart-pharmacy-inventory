import React, { useState } from 'react';
import { Settings as SettingsIcon, Cpu, RefreshCw, Radio } from 'lucide-react';
import { api } from '../services/api';

export default function Settings({ onOpenSimulator }) {
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (!window.confirm("Reinitialize the entire database with clean sample clinical pharmacy data?")) return;
    try {
      setResetting(true);
      await api.resetDemoData();
      alert("Database reinitialized with sample clinical dataset!");
      window.location.reload();
    } catch (err) {
      alert("Reset error: " + err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-black uppercase tracking-tight">System Settings & Hardware Integration</h2>
        <p className="text-xs font-bold text-black/70 mt-0.5">Configuration endpoints, ESP32 microcontroller pinouts, and demonstration controls.</p>
      </div>

      {/* Simulator Quick Action (Electric Yellow & Lime, NO purple/blue) */}
      <div className="bg-[#fef08a] p-6 rounded-2xl border-3 border-black shadow-[6px_6px_0px_0px_#000] text-black flex items-center justify-between">
        <div>
          <span className="bg-black text-white font-black text-[10px] uppercase px-2 py-0.5 rounded tracking-widest inline-block mb-1">
            Evaluation & Presentation Tool
          </span>
          <h3 className="font-black text-lg uppercase mt-0.5">Hardware Virtual Simulator</h3>
          <p className="text-black/80 font-bold text-xs mt-1 max-w-lg">
            Simulate RC522 RFID card scans and slide DHT22 temperature & humidity values without requiring physical hardware plugged in.
          </p>
        </div>
        <button
          onClick={onOpenSimulator}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#86efac] text-black text-xs font-black uppercase rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
        >
          <Cpu className="h-4 w-4 stroke-[2.5]" />
          Launch Simulator
        </button>
      </div>

      {/* Hardware Wiring Pinouts Reference Card */}
      <div className="bg-white p-5 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_#000] space-y-4">
        <div className="flex items-center gap-2 border-b-2 border-black pb-3 bg-[#bbf7d0] -mx-5 -mt-5 p-4 rounded-t-xl">
          <Radio className="h-5 w-5 text-black stroke-[2.5]" />
          <h3 className="font-black text-black text-xs uppercase">ESP32 DevKit Physical Wiring Reference</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-[#fffdf5] border-2 border-black rounded-xl space-y-2 shadow-[2px_2px_0px_0px_#000]">
            <span className="font-black text-black block text-xs uppercase tracking-wider bg-[#86efac] px-2 py-0.5 rounded border border-black inline-block">
              RC522 RFID Module (SPI):
            </span>
            <div className="font-mono font-bold space-y-1 text-black text-[11px]">
              <div>• VCC  -&gt; <b>3.3V</b> (DO NOT USE 5V)</div>
              <div>• RST  -&gt; <b>GPIO 22</b></div>
              <div>• GND  -&gt; <b>GND</b></div>
              <div>• MISO -&gt; <b>GPIO 19</b></div>
              <div>• MOSI -&gt; <b>GPIO 23</b></div>
              <div>• SCK  -&gt; <b>GPIO 18</b></div>
              <div>• SDA  -&gt; <b>GPIO 5</b> (SS)</div>
            </div>
          </div>

          <div className="p-3.5 bg-[#fffdf5] border-2 border-black rounded-xl space-y-2 shadow-[2px_2px_0px_0px_#000]">
            <span className="font-black text-black block text-xs uppercase tracking-wider bg-[#fed7aa] px-2 py-0.5 rounded border border-black inline-block">
              DHT22 Climate Sensor:
            </span>
            <div className="font-mono font-bold space-y-1 text-black text-[11px]">
              <div>• VCC (+) -&gt; <b>3.3V</b></div>
              <div>• OUT     -&gt; <b>GPIO 27</b></div>
              <div>• GND (-) -&gt; <b>GND</b></div>
              <div className="pt-2 text-[10px] text-black/70 font-sans font-bold">
                Sampling Interval: 15 seconds (non-blocking)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Environment Variables Overview */}
      <div className="bg-white p-5 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_#000] space-y-4">
        <h3 className="font-black text-black text-xs uppercase border-b-2 border-black pb-2">
          Environment & Security Configuration (.env)
        </h3>

        <div className="space-y-2.5 text-xs font-mono font-bold">
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#fffdf5] border-2 border-black text-black shadow-[2px_2px_0px_0px_#000]">
            <span>DATABASE_URL</span>
            <span className="bg-[#fef08a] px-2 py-0.5 rounded border border-black">postgresql://localhost:5432/pharma_inventory (or sqlite)</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#fffdf5] border-2 border-black text-black shadow-[2px_2px_0px_0px_#000]">
            <span>THINGSPEAK_CHANNEL_ID</span>
            <span className="bg-[#bbf7d0] px-2 py-0.5 rounded border border-black">1234567</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#fffdf5] border-2 border-black text-black shadow-[2px_2px_0px_0px_#000]">
            <span>EMAIL_HOST / IMAP</span>
            <span className="bg-[#fed7aa] px-2 py-0.5 rounded border border-black">imap.gmail.com:993</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#fffdf5] border-2 border-black text-black shadow-[2px_2px_0px_0px_#000]">
            <span>WIFI_SSID</span>
            <span className="bg-[#fef08a] px-2 py-0.5 rounded border border-black">Pharmacy_IoT_WiFi</span>
          </div>
        </div>
      </div>

      {/* Database Maintenance Card */}
      <div className="bg-white p-5 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_#000] flex items-center justify-between">
        <div>
          <h4 className="font-black text-black text-sm uppercase">Demo Data Reinitialization</h4>
          <p className="text-xs font-bold text-black/70 mt-0.5">
            Reset medicines (Paracetamol, Amoxicillin, Cetirizine, Azithromycin, Ibuprofen), batches, RFID tags, and invoices.
          </p>
        </div>
        <button
          onClick={handleReset}
          disabled={resetting}
          className="flex items-center gap-2 px-4 py-2 bg-[#fca5a5] text-black border-2 border-black rounded-xl text-xs font-black uppercase shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${resetting ? 'animate-spin' : ''}`} />
          {resetting ? "Resetting..." : "Reset Demo Database"}
        </button>
      </div>
    </div>
  );
}
