import React from "react";

const Transaction = ({
  handleCreateTransaction,
  txTitle,
  setTxTitle,
  txAmount,
  setTxAmount,
  txType,
  setTxType,
  txEnvelope,
  setTxEnvelope,
  envelopes,
  transactions,
  handleDeleteTransaction,
}) => {
  return (
    <>
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-6">
        <h3 className="text-xl font-bold">Add Transaction</h3>
        <form onSubmit={handleCreateTransaction} className="space-y-4">
          <input
            type="text"
            placeholder="Title (e.g. Grocery Store)"
            value={txTitle}
            onChange={(e) => setTxTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
            required
          />
          <input
            type="number"
            placeholder="Amount ($)"
            value={txAmount}
            onChange={(e) => setTxAmount(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
            required
          />
          <div className="flex gap-4">
            <select
              value={txType}
              onChange={(e) => setTxType(e.target.value)}
              className="w-1/2 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            {txType === "expense" && (
              <select
                value={txEnvelope}
                onChange={(e) => setTxEnvelope(e.target.value)}
                className="w-1/2 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                required
              >
                <option value="">Select Envelope</option>
                {envelopes.map((env) => (
                  <option key={env._id} value={env._id}>
                    {env.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 py-2 rounded font-medium transition"
          >
            Save Transaction
          </button>
        </form>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {transactions.map((tx) => (
            <div
              key={tx._id}
              className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-sm">{tx.title}</p>
                <p className="text-xs text-slate-400">
                  {tx.type === "expense"
                    ? `Envelope: ${tx.envelopeId?.name || "General"}`
                    : "Income"}{" "}
                  • {new Date(tx.date).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`font-bold ${tx.type === "income" ? "text-emerald-400" : "text-rose-400"}`}
                >
                  {tx.type === "income" ? "+" : "-"}${tx.amount}
                </span>
                <button
                  onClick={() => handleDeleteTransaction(tx._id)}
                  className="text-rose-500 text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Transaction;
