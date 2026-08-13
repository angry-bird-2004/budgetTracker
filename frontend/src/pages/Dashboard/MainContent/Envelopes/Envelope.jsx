import React from "react";

const Envelope = ({
  handleCreateEnvelope,
  envName,
  setEnvName,
  envAmount,
  setEnvAmount,
  envelopes,
  transactions,
  handleDeleteEnvelope,
  handleUpdateEnvelope,
  editingEnvId,
  setEditingEnvId,
}) => {
  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">
          {editingEnvId ? "Edit Budget Envelope" : "Budget Envelopes"}
        </h3>
        {editingEnvId && (
          <button
            onClick={() => {
              setEditingEnvId(null);
              setEnvName("");
              setEnvAmount("");
            }}
            className="text-slate-400 text-xs hover:text-white underline"
          >
            Cancel Edit
          </button>
        )}
      </div>
      <form onSubmit={handleCreateEnvelope} className="space-y-4">
        <input
          type="text"
          placeholder="Envelope Name (e.g. Groceries)"
          value={envName}
          onChange={(e) => setEnvName(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
          required
        />
        <input
          type="number"
          placeholder="Allocated Limit ($)"
          value={envAmount}
          onChange={(e) => setEnvAmount(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
          required
        />
        <button
          type="submit"
          className={`w-full py-2 rounded font-medium transition ${
            editingEnvId
              ? "bg-amber-600 hover:bg-amber-700 text-white"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
        >
          {editingEnvId ? "Update Envelope" : "Create Envelope"}
        </button>
      </form>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {envelopes.map((env) => {
          // Check all potential keys for the allocated limit value
          const limit = Number(
            env.allocatedAmount ?? env.limit ?? env.amount ?? 0
          );

          // Calculate spent amount matching transaction envelope IDs safely
          const spent = transactions
            .filter(
              (t) =>
                t.envelopeId?._id === env._id ||
                t.envelopeId === env._id ||
                t.envelope === env._id
            )
            .reduce((acc, t) => acc + Number(t.amount || 0), 0);

          // Calculate percentage safely to avoid division by zero
          const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;

          return (
            <div
              key={env._id}
              className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2"
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold">{env.name}</span>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleUpdateEnvelope(env._id)}
                    className="text-indigo-400 text-xs hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteEnvelope(env._id)}
                    className="text-rose-400 text-xs hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Spent: ${spent.toFixed(2)}</span>
                <span>Limit: ${limit.toFixed(2)}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    pct > 90 ? "bg-rose-500" : "bg-indigo-500"
                  }`}
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Envelope;