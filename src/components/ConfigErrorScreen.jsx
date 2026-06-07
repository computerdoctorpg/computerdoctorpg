import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfigErrorScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
    <div className="max-w-lg w-full bg-slate-800 border border-amber-500/40 rounded-2xl p-8 text-white shadow-2xl">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0" />
        <h1 className="text-xl font-bold">Aplikacija nije podešena</h1>
      </div>
      <p className="text-slate-300 text-sm leading-relaxed mb-4">
        Supabase ključevi nisu učitani na serveru. Zato se prikazuje prazna stranica.
      </p>
      <div className="bg-slate-900/80 rounded-lg p-4 text-sm text-slate-300 space-y-2">
        <p className="font-semibold text-white">U Hostinger Node.js app dodaj:</p>
        <ul className="list-disc list-inside space-y-1 font-mono text-xs text-amber-200/90">
          <li>VITE_SUPABASE_URL</li>
          <li>VITE_SUPABASE_ANON_KEY</li>
        </ul>
        <p className="pt-2 text-slate-400">
          Zatim klikni <strong className="text-white">Redeploy</strong>.
          Start command mora biti <code className="text-green-300">npm start</code>.
        </p>
      </div>
    </div>
  </div>
);

export default ConfigErrorScreen;
