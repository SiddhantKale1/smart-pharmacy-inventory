import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Pill,
  Layers,
  Radio,
  ScanLine,
  Printer,
  ShoppingCart,
  Receipt,
  BellRing,
  ThermometerSnowflake,
  CloudUpload,
  Truck,
  Mail,
  FileCheck2,
  TrendingUp,
  Settings as SettingsIcon,
  ShieldCheck
} from 'lucide-react';

const navItems = [
  { group: "Overview", items: [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Inventory", path: "/inventory", icon: Boxes },
    { name: "Alerts & Expiry", path: "/alerts", icon: BellRing },
  ]},
  { group: "Pharmacy Master", items: [
    { name: "Medicines", path: "/medicines", icon: Pill },
    { name: "Batches", path: "/batches", icon: Layers },
    { name: "Suppliers", path: "/suppliers", icon: Truck },
  ]},
  { group: "RFID & POS Operations", items: [
    { name: "Sales Terminal", path: "/sales", icon: ShoppingCart },
    { name: "RFID Tag Manager", path: "/rfid", icon: Radio },
    { name: "Assign Tag", path: "/rfid/assign", icon: ScanLine },
    { name: "Print Label", path: "/rfid/print", icon: Printer },
    { name: "Transactions", path: "/transactions", icon: Receipt },
  ]},
  { group: "IoT & Ingestion", items: [
    { name: "Climate & Sensors", path: "/sensors", icon: ThermometerSnowflake },
    { name: "ThingSpeak IoT", path: "/thingspeak", icon: CloudUpload },
    { name: "Email Ingestion", path: "/email-import", icon: Mail },
    { name: "Invoice Verification", path: "/invoices", icon: FileCheck2 },
  ]},
  { group: "Intelligence & Admin", items: [
    { name: "Demand Prediction (ML)", path: "/ml", icon: TrendingUp },
    { name: "Settings & Simulator", path: "/settings", icon: SettingsIcon },
  ]}
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#fffef5] text-black flex flex-col shrink-0 h-screen sticky top-0 border-r-2 border-black z-30 select-none shadow-[2px_0px_0px_0px_#000]">
      {/* Brand Header */}
      <div className="p-4 border-b-2 border-black bg-[#fef08a] flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-[#86efac] border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_#000]">
          <ShieldCheck className="h-6 w-6 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="font-black text-black text-base tracking-tight leading-none uppercase">Apex Pharma</h1>
          <p className="text-[10px] font-black text-black/80 mt-1 uppercase tracking-widest bg-white px-1.5 py-0.5 rounded border border-black inline-block">
            IoT Smart System
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navItems.map((section, idx) => (
          <div key={idx}>
            <p className="px-3 text-[10px] font-black text-black uppercase tracking-widest mb-1.5">
              {section.group}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-black transition-all duration-100 ${
                        isActive
                          ? "bg-[#86efac] text-black border-2 border-black shadow-[3px_3px_0px_0px_#000] translate-x-0.5"
                          : "text-slate-800 hover:bg-[#fed7aa] hover:text-black border-2 border-transparent hover:border-black hover:shadow-[2px_2px_0px_0px_#000]"
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0 stroke-[2.5]" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t-2 border-black bg-[#fde047] text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-black font-black uppercase font-mono">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 border border-black animate-ping"></span>
          <span>ESP32 Gateway Active</span>
        </div>
        <p className="text-[10px] font-bold text-black/70 mt-0.5 uppercase tracking-wide">College IoE Project</p>
      </div>
    </aside>
  );
}
