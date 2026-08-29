import React from "react";

const ExpenseEnvelope = ({ txEnvelope, setTxEnvelope, envelopes = [] }) => {
  const list = Array.isArray(envelopes) ? envelopes : [];

  return (
    <div>
      <label className="block text-xs font-medium text-slate-300 mb-1">
        Budget Envelope
      </label>
      <select
        required
        value={txEnvelope || ""}
        onChange={(e) => setTxEnvelope(e.target.value)}
        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 truncate"
      >
        <option value="">
          {list.length ? "Select Expense Envelope" : "No budget envelopes yet"}
        </option>
        {list.map((env) => (
          <option key={String(env._id)} value={String(env._id)}>
            {env.name}
          </option>
        ))}
      </select>
      {list.length === 0 && (
        <p className="mt-1 text-[11px] text-slate-500">
          Create a budget envelope first — it will show up here for new
          transactions.
        </p>
      )}
    </div>
  );
};

export default ExpenseEnvelope;
