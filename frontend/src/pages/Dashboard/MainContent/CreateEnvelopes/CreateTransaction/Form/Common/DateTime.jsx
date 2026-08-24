import React from "react";

const DateTime = ({ txDate, setTxDate }) => {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-300 mb-1">
        Date
      </label>
      <input
        type="date"
        value={txDate}
        onChange={(e) => setTxDate(e.target.value)}
        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
      />
    </div>
  );
};

export default DateTime;
