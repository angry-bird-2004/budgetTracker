import React from "react";

const SettingsHeader = () => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-slate-950/30">
    <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
      Preferences
    </p>
    <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
      Settings
    </h1>
    <p className="mt-1 text-sm text-slate-400">
      Control how lists and tabs behave across the dashboard.
    </p>
  </div>
);

export default SettingsHeader;
