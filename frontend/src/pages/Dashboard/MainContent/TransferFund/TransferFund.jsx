import React from "react";

const TransferFund = ({
  showTransferModal,
  setShowTransferModal,
  transferType,
  setTransferType,
  fromEnvId,
  setFromEnvId,
  toEnvId,
  setToEnvId,
  envelopes,
  incomeEnvelopes,
  transferAmount,
  setTransferAmount,
  symbol,
  handleMaxTransfer,
  executeTransfer,
}) => {
  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div>
          <p className="text-xs font-semibold text-slate-200">
            Envelope Fund Transfers
          </p>
          <p className="text-[11px] text-slate-400">
            Transfer partial or full amounts between envelopes seamlessly.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowTransferModal(true)}
          className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-semibold rounded-lg transition"
        >
          Transfer Funds
        </button>
      </div>

      {/* Transfer Modal / Drawer */}
      {showTransferModal && (
        <div className="bg-slate-950 border border-emerald-900/50 rounded-xl p-4 sm:p-5 space-y-4 shadow-2xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Transfer Between Envelopes
            </h3>
            <button
              type="button"
              onClick={() => setShowTransferModal(false)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕ Close
            </button>
          </div>
          <form onSubmit={executeTransfer} className="space-y-3">
            <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setTransferType("expense")}
                className={`py-1.5 text-xs font-medium rounded transition ${
                  transferType === "expense"
                    ? "bg-slate-800 text-white shadow"
                    : "text-slate-400"
                }`}
              >
                Expense Envelopes
              </button>
              <button
                type="button"
                onClick={() => setTransferType("income")}
                className={`py-1.5 text-xs font-medium rounded transition ${
                  transferType === "income"
                    ? "bg-slate-800 text-emerald-400 shadow"
                    : "text-slate-400"
                }`}
              >
                Income Envelopes
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  From Envelope
                </label>
                <select
                  required
                  value={fromEnvId}
                  onChange={(e) => setFromEnvId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100"
                >
                  <option value="">Select Source</option>
                  {(transferType === "expense"
                    ? envelopes
                    : incomeEnvelopes
                  ).map((env) => (
                    <option key={env._id} value={env._id}>
                      {env.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  To Envelope
                </label>
                <select
                  required
                  value={toEnvId}
                  onChange={(e) => setToEnvId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100"
                >
                  <option value="">Select Destination</option>
                  {(transferType === "expense" ? envelopes : incomeEnvelopes)
                    .filter((env) => env._id !== fromEnvId)
                    .map((env) => (
                      <option key={env._id} value={env._id}>
                        {env.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] text-slate-400">
                  Transfer Amount ({symbol})
                </label>
                {fromEnvId && (
                  <button
                    type="button"
                    onClick={handleMaxTransfer}
                    className="text-[10px] text-emerald-400 hover:underline font-semibold"
                  >
                    Transfer All (Max)
                  </button>
                )}
              </div>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-lg text-xs transition"
            >
              Confirm Transfer
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default TransferFund;
