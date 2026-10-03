import React from 'react';

export function Card({ title, subtitle, icon: Icon, action, children, className = "", headerBg = "bg-[#fef08a]" }) {
  return (
    <div className={`bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden flex flex-col ${className}`}>
      {(title || Icon || action) && (
        <div className={`px-5 py-3.5 border-b-2 border-black flex items-center justify-between ${headerBg}`}>
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="p-1.5 rounded-lg bg-black text-white border border-black shadow-[2px_2px_0px_0px_#000]">
                <Icon className="h-4 w-4" />
              </div>
            )}
            <div>
              {title && <h3 className="font-black text-black text-sm tracking-tight uppercase">{title}</h3>}
              {subtitle && <p className="text-[11px] font-bold text-slate-800 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5 flex-1">{children}</div>
    </div>
  );
}

export function StatCard({ label, value, subtext, icon: Icon, color = "yellow", statusBadge }) {
  // Vibrant Neobrutalism palette without purple and blue
  const colorMap = {
    yellow: "bg-[#fef08a]",
    lime: "bg-[#bbf7d0]",
    orange: "bg-[#fed7aa]",
    coral: "bg-[#fecaca]",
    green: "bg-[#86efac]",
    white: "bg-white",
  };

  const bgClass = colorMap[color] || colorMap.yellow;

  return (
    <div className={`rounded-xl border-2 border-black p-5 shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] transition-all relative overflow-hidden ${bgClass}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-black text-black uppercase tracking-wider">{label}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-black tracking-tight">{value}</span>
            {statusBadge}
          </div>
          {subtext && <p className="text-xs font-bold text-black/70 mt-1">{subtext}</p>}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-lg bg-black text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
            <Icon className="h-5 w-5 stroke-[2.5]" />
          </div>
        )}
      </div>
    </div>
  );
}
