import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-xl" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-100">
      <div className={`bg-white rounded-xl shadow-[8px_8px_0px_0px_#000] border-4 border-black w-full ${maxWidth} overflow-hidden transform transition-all`}>
        <div className="px-6 py-3.5 border-b-2 border-black flex items-center justify-between bg-[#fef08a]">
          <h3 className="font-black text-black text-sm uppercase tracking-wider">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md bg-[#f87171] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
          >
            <X className="h-4 w-4 stroke-[3]" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto bg-[#fffdf5]">{children}</div>
      </div>
    </div>
  );
}
