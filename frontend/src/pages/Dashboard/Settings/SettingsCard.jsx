import React from "react";

const SettingsCard = ({ eyebrow = "Display", title, description, children }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-slate-950/20">
    <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
      {eyebrow}
    </p>
    <h2 className="mt-2 text-lg font-semibold text-white">{title}</h2>
    {description ? (
      <p className="mt-1 text-sm text-slate-400">{description}</p>
    ) : null}
    <div className="mt-4">{children}</div>
  </div>
);

export default SettingsCard;
