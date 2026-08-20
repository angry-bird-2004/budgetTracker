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
  formatAmount,
  handleMaxTransfer,
  executeTransfer,
}) => {
  const sourceList = transferType === "expense" ? envelopes : incomeEnvelopes;
  const availableSource = sourceList.find((env) => env._id === fromEnvId);
  const availableBalance = Number(availableSource?.allocatedAmount || 0);

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_10px_24px_rgba(15,23,42,0.25)] hover:shadow-[0_12px_28px_rgba(16,185,129,0.08)] transition-all duration-200">
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
          className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 hover:border-emerald-500/50 text-emerald-400 border border-slate-700 text-xs font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-[0_0_0_1px_rgba(16,185,129,0.2)]"
        >
          Transfer Funds
        </button>
      </div>

      {/* Transfer Modal / Drawer */}
      {showTransferModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6"
          onClick={() => setShowTransferModal(false)}
        >
          <div
            className="w-full max-w-2xl rounded-xl border border-emerald-900/50 bg-slate-950 p-4 shadow-[0_22px_50px_rgba(2,6,23,0.7)] sm:p-5"
            onClick={(e) => e.stopPropagation()}
          >
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
            <form onSubmit={executeTransfer} className="space-y-3 pt-3">
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
                <div className="flex justify-between items-center mb-1 gap-2">
                  <label className="text-[11px] text-slate-400">
                    Transfer Amount ({symbol})
                  </label>
                  {fromEnvId && (
                    <button
                      type="button"
                      onClick={handleMaxTransfer}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 hover:underline font-semibold"
                    >
                      Transfer All (Max)
                    </button>
                  )}
                </div>
                {fromEnvId && (
                  <p className="mb-2 text-[10px] text-slate-400">
                    Available: <span className="font-semibold text-slate-200">{symbol}{formatAmount(availableBalance)}</span>
                  </p>
                )}
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 focus:shadow-[0_0_0_1px_rgba(16,185,129,0.24)]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg text-xs transition-all duration-200 shadow-[0_6px_18px_rgba(16,185,129,0.22)] hover:shadow-[0_10px_22px_rgba(16,185,129,0.24)]"
              >
                Confirm Transfer
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TransferFund;
