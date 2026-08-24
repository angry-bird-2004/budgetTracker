import React from "react";

const ExpenseEnvelope = ({ txEnvelope, setTxEnvelope, envelopes }) => {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-300 mb-1">
        Budget Envelope
      </label>
      <select
        required
        value={txEnvelope}
        onChange={(e) => setTxEnvelope(e.target.value)}
        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 truncate"
      >
        <option value="">Select Expense Envelope</option>
        {envelopes.map((env) => (
          <option key={env._id} value={env._id}>
            {env.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ExpenseEnvelope;
