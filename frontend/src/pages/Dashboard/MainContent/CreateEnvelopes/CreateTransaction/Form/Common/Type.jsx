import React from "react";

const Type = ({ txType, setTxType }) => {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-300 mb-1">
        Type
      </label>
      <select
        required
        value={txType}
        onChange={(e) => setTxType(e.target.value)}
        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
      >
        <option value="expense">Expense (Debit)</option>
        <option value="income">Income (Credit)</option>
      </select>
    </div>
  );
};

export default Type;
