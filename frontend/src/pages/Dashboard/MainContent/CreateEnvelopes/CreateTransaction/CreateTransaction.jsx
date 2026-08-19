import React from "react";

const CreateTransaction = ({
  transactionFormRef,
  editingTxId,
  handleCancelEditTransaction,
  handleCreateTransaction,
  txType,
  setTxType,
  txTitle,
  setTxTitle,
  txAmount,
  setTxAmount,
  symbol,
  formatAmount,
  envelopes,
  txEnvelope,
  setTxEnvelope,
  incomeEnvelopes,
  txIncomeEnvelope,
  setTxIncomeEnvelope,
  transactions,
  paymentMethod,
  setPaymentMethod,
  incomeSource,
  setIncomeSource,
  purpose,
  setPurpose,
  txDate,
  setTxDate,
  taxPercentage,
  setTaxPercentage,
  taxAmount,
  setTaxAmount,
  taxApplication,
  setTaxApplication,
}) => {
  return (
    <>
      <div
        ref={transactionFormRef}
        className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold tracking-wide text-slate-200 truncate">
            {editingTxId ? "Edit Transaction" : "New Transaction"}
          </h2>
          {editingTxId && (
            <button
              type="button"
              onClick={handleCancelEditTransaction}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium shrink-0 ml-2"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleCreateTransaction} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setTxType("expense")}
              className={`py-2 sm:py-1.5 text-xs font-medium rounded transition ${
                txType === "expense"
                  ? "bg-rose-600/20 text-rose-400 border border-rose-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setTxType("income")}
              className={`py-2 sm:py-1.5 text-xs font-medium rounded transition ${
                txType === "income"
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Income
            </button>
          </div>

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

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Amount ({symbol})
            </label>
            <input
              type="number"
              step="any"
              required
              placeholder="0.00"
              value={txAmount}
              onChange={(e) => setTxAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Expense Envelope Selector */}
          {txType === "expense" && (
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
          )}

          {/* Income Envelope Selector (Appears when txType is 'income') */}
          {txType === "income" && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Income Envelope
              </label>
              <select
                required
                value={txIncomeEnvelope || ""}
                onChange={(e) => setTxIncomeEnvelope(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 truncate"
              >
                <option value="">Select Income Envelope Target</option>
                {incomeEnvelopes.map((inc) => {
                  const spentForThisEnv = transactions
                    .filter((t) => {
                      if (t.type !== "expense") return false;
                      const sourceRef = t.incomeSource || t.txIncomeEnvelope;
                      const sourceId =
                        typeof sourceRef === "object" && sourceRef !== null
                          ? sourceRef._id
                          : sourceRef;
                      return String(sourceId) === String(inc._id);
                    })
                    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

                  const remainingForThisEnv =
                    Number(inc.allocatedAmount || 0) - spentForThisEnv;

                  return (
                    <option key={inc._id} value={inc._id}>
                      {inc.name} (Rem: {symbol}
                      {formatAmount(remainingForThisEnv)})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>

          {txType === "expense" && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Pay From Income Envelope
              </label>
              <select
                required
                value={incomeSource}
                onChange={(e) => setIncomeSource(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 truncate"
              >
                <option value="">Select Income Envelope Source</option>
                {incomeEnvelopes.map((inc) => {
                  const spentForThisEnv = transactions
                    .filter((t) => {
                      if (t.type !== "expense") return false;
                      const sourceRef = t.incomeSource || t.txIncomeEnvelope;
                      const sourceId =
                        typeof sourceRef === "object" && sourceRef !== null
                          ? sourceRef._id
                          : sourceRef;
                      return String(sourceId) === String(inc._id);
                    })
                    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

                  const remainingForThisEnv =
                    Number(inc.allocatedAmount || 0) - spentForThisEnv;

                  return (
                    <option key={inc._id} value={inc._id}>
                      {inc.name} (Rem: {symbol}
                      {formatAmount(remainingForThisEnv)})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

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

          {txType === "expense" && (
            <div className="space-y-3 pt-2 border-t border-slate-800 min-w-0">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Tax Details
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div className="min-w-0">
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Tax (%)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0%"
                    value={taxPercentage}
                    onChange={(e) => setTaxPercentage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 sm:p-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Fixed Tax ({symbol})
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 sm:p-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="min-w-0">
                <label className="block text-[11px] text-slate-400 mb-1">
                  Tax Application
                </label>
                <select
                  value={taxApplication}
                  onChange={(e) => setTaxApplication(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="exclusive">Exclusive (Added to amount)</option>
                  <option value="inclusive">
                    Inclusive (Included in amount)
                  </option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 sm:py-2.5 rounded-lg text-xs sm:text-sm transition shadow-sm"
          >
            {editingTxId ? "Update Transaction" : "Add Transaction"}
          </button>
        </form>
      </div>
    </>
  );
};

export default CreateTransaction;