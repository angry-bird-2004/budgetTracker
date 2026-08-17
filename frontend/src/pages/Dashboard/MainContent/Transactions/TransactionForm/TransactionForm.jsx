import React from 'react'

const TransactionForm = ({
  editingTxId,
  handleCancelEditTransaction,
  handleCreateTransaction,
  handleUpdateTransaction,
  txTitle,
  setTxTitle,
  txAmount,
  setTxAmount,
  symbol,
  txType,
  setTxType,
  txEnvelope,
  setTxEnvelope,
  envelopes,
  paymentMethod,
  setPaymentMethod,
  incomeSource,
  setIncomeSource,
  transactions,
  formatAmount,
  purpose,
  setPurpose,
  taxMode,
  setTaxMode,
  taxApplication,
  setTaxApplication,
  taxPercentage,
  setTaxPercentage,
  taxAmount,
  setTaxAmount,
  txDate,
  setTxDate,
}) => {
  
  const onSubmitHandler = (e) => {
    e.preventDefault();
    if (handleCreateTransaction) {
      handleCreateTransaction(e);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">
          {editingTxId ? "Edit Transaction" : "Add Transaction"}
        </h3>
        {editingTxId && (
          <button
            type="button"
            onClick={handleCancelEditTransaction}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded transition"
          >
            Cancel Edit
          </button>
        )}
      </div>
      
      <form onSubmit={onSubmitHandler} className="space-y-4">
        {/* Title & Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Title (e.g. Salary, Grocery Store)"
            value={txTitle}
            onChange={(e) => setTxTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
            required
          />
          <input
            type="number"
            placeholder={`Amount (${symbol.trim()})`}
            value={txAmount}
            onChange={(e) => setTxAmount(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
            required
          />
        </div>

        {/* Transaction Type & Envelope / Payment Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <select
            value={txType}
            onChange={(e) => setTxType(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>

          {txType === "expense" ? (
            <select
              value={txEnvelope}
              onChange={(e) => setTxEnvelope(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
              required
            >
              <option value="">Select Envelope</option>
              {envelopes.map((env) => (
                <option key={env._id} value={env._id}>
                  {env.name}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
            >
              <option value="cash">Cash Payment</option>
              <option value="card">Card Payment</option>
            </select>
          )}
        </div>

        {/* Expense Specific Fields: Payment Method & Purpose */}
        {txType === "expense" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
            >
              <option value="cash">Cash Payment</option>
              <option value="card">Card Payment</option>
            </select>
            <input
              type="text"
              placeholder="Purpose (e.g. Monthly groceries)"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
            />
          </div>
        )}

        {/* Pay From Income Source Field (Expense Only) */}
        {txType === "expense" && (
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Pay From Income Source
            </label>
            <select
              value={incomeSource || ""}
              onChange={(e) => setIncomeSource(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white text-xs"
            >
              <option value="">Select Income Source (Optional)</option>
              {transactions
                .filter((t) => t.type === "income")
                .map((inc) => (
                  <option key={inc._id} value={inc._id}>
                    {inc.title} ({symbol}{formatAmount ? formatAmount(inc.amount) : inc.amount})
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Advanced Tax Configuration Fields (Expense Only) */}
        {txType === "expense" && (
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Tax Configuration</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select
                value={taxMode}
                onChange={(e) => {
                  setTaxMode(e.target.value);
                  setTaxPercentage("");
                  setTaxAmount("");
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white text-xs"
              >
                <option value="percentage">Tax by Percentage (%)</option>
                <option value="fixed">Tax by Fixed Amount ({symbol.trim()})</option>
              </select>

              <select
                value={taxApplication}
                onChange={(e) => setTaxApplication(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white text-xs"
              >
                <option value="exclusive">Tax Added on Top (Exclusive)</option>
                <option value="inclusive">Tax Already Included in Amount</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {taxMode === "percentage" ? (
                <input
                  type="number"
                  placeholder="Tax Percentage e.g. 5 (for 5%)"
                  value={taxPercentage}
                  onChange={(e) => setTaxPercentage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white text-xs"
                />
              ) : (
                <input
                  type="number"
                  placeholder={`Fixed Tax Amount (${symbol.trim()})`}
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white text-xs"
                />
              )}
            </div>
          </div>
        )}

        {/* Date/Time */}
        <div className="grid grid-cols-1 gap-4">
          <input
            type="date"
            value={txDate}
            onChange={(e) => setTxDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 py-2 rounded font-medium transition text-white"
        >
          {editingTxId ? "Update Transaction" : "Save Transaction"}
        </button>
      </form>
    </>
  );
};

export default TransactionForm;