import React from "react";

const Purpose = ({ purpose, setPurpose }) => {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-300 mb-1">
        Purpose / Notes
      </label>
      <input
        type="text"
        placeholder="Reason or notes..."
        value={purpose}
        onChange={(e) => setPurpose(e.target.value)}
        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
      />
    </div>
  );
};

export default Purpose;
