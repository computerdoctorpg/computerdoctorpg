import React from 'react';
import { Database } from 'lucide-react';
import { getDataPolicyLabels, resolveKeepData } from '@/lib/dataPolicy';

export { resolveKeepData };

const printExact = {
  WebkitPrintColorAdjust: 'exact',
  printColorAdjust: 'exact',
};

export function DataPolicyFields({ keepData, onChange, disabled = false }) {
  return (
    <div className={`bg-slate-900/40 p-3 rounded-lg border border-slate-700 ${disabled ? 'opacity-50' : ''}`}>
      <p className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
        <Database className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
        Podaci na uređaju — izaberite jednu opciju
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(false)}
          className={`flex-1 py-2.5 px-2 rounded-lg border text-sm font-bold uppercase tracking-wide transition-all ${
            !keepData
              ? 'border-red-500/70 bg-red-500/15 text-red-300 shadow-sm'
              : 'border-slate-600 bg-slate-800/40 text-slate-500 line-through decoration-slate-500'
          }`}
        >
          Brisati
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(true)}
          className={`flex-1 py-2.5 px-2 rounded-lg border text-sm font-bold uppercase tracking-wide transition-all ${
            keepData
              ? 'border-yellow-500/70 bg-yellow-500/15 text-yellow-300 shadow-sm'
              : 'border-slate-600 bg-slate-800/40 text-slate-500 line-through decoration-slate-500'
          }`}
        >
          Sačuvati
        </button>
      </div>
      <p className="text-[10px] text-slate-500 mt-2 leading-snug">
        Na prijemnici se precrtava opcija koja ne važi.
      </p>
    </div>
  );
}

export function DataPolicyPrint({ ticket, className = '' }) {
  const { deleteLabel, keepLabel, keep } = getDataPolicyLabels(ticket);

  return (
    <span className={`inline-flex items-center gap-3 font-extrabold uppercase tracking-wider ${className}`}>
      <span
        className={`text-[14px] leading-none ${
          keep
            ? 'line-through text-gray-400 decoration-2 decoration-gray-400'
            : 'text-red-600'
        }`}
        style={printExact}
      >
        {deleteLabel}
      </span>
      <span className="text-gray-400 font-normal text-[12px]">/</span>
      <span
        className={`text-[14px] leading-none ${
          !keep
            ? 'line-through text-gray-400 decoration-2 decoration-gray-400'
            : 'text-red-600'
        }`}
        style={printExact}
      >
        {keepLabel}
      </span>
    </span>
  );
}
