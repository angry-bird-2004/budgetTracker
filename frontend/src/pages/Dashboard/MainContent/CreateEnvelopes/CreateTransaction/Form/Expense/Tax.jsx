import React from "react";

const Tax = ({
  taxPercentage,
  setTaxPercentage,
  taxAmount,
  setTaxAmount,
  taxApplication,
  setTaxApplication,
  symbol,
}) => {
  return (
    <div className="space-y-3 pt-2 border-t border-slate-800 min-w-0">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
        Tax Details
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div className="min-w-0">
          <label className="block text-[11px] text-slate-400 mb-1">
            Tax (%)
          </label>
          <input
            type="number"
            step="any"
            placeholder="0%"
            value={taxPercentage}
            onChange={(e) => setTaxPercentage(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 sm:p-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="min-w-0">
          <label className="block text-[11px] text-slate-400 mb-1">
            Fixed Tax ({symbol})
          </label>
          <input
            type="number"
            step="any"
            placeholder="0.00"
            value={taxAmount}
            onChange={(e) => setTaxAmount(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 sm:p-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="min-w-0">
        <label className="block text-[11px] text-slate-400 mb-1">
          Tax Application
        </label>
        <select
          value={taxApplication}
          onChange={(e) => setTaxApplication(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
        >
          <option value="exclusive">Exclusive (Added to amount)</option>
          <option value="inclusive">Inclusive (Included in amount)</option>
        </select>
      </div>
    </div>
  );
};

export default Tax;
