import React from "react";

const Title = ({ txTitle, setTxTitle }) => {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-300 mb-1">
        Title
      </label>
      <input
        type="text"
        required
        placeholder="e.g. Grocery, Salary"
        value={txTitle}
        onChange={(e) => setTxTitle(e.target.value)}
        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
      />
    </div>
  );
};

export default Title;
