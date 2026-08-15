import React, { useState } from "react";

const Maincontent = ({
  handleUpdateTransaction,
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
  handleCreateTransaction,
  txTitle,
  setTxTitle,
  txAmount,
  setTxAmount,
  txType,
  setTxType,
  txEnvelope,
  setTxEnvelope,
  taxApplication,
  setTaxApplication,
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
  handleDeleteTransaction,
  currency,
  formatAmount,
  editingTxId,
  handleStartEditTransaction,
  handleCancelEditTransaction,
}) => {
  const [expandedTxId, setExpandedTxId] = useState(null);
  const symbol = currency === "PKR" ? "Rs " : "$";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Forms (Transaction & Envelope Management) */}
      <div className="space-y-6 lg:col-span-1">
        {/* Transaction Form Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold tracking-wide text-slate-200">
              {editingTxId ? "Edit Transaction" : "New Transaction"}
            </h2>
            {editingTxId && (
              <button
                type="button"
                onClick={handleCancelEditTransaction}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleCreateTransaction} className="space-y-4">
            {/* Type Switcher */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setTxType("expense")}
                className={`py-1.5 text-xs font-medium rounded transition ${
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
                className={`py-1.5 text-xs font-medium rounded transition ${
                  txType === "income"
                    ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Income
              </button>
            </div>

            {/* Title */}
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
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Amount */}
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
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Envelope Selection (Visible only for Expense) */}
            {txType === "expense" && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Budget Envelope
                </label>
                <select
                  required
                  value={txEnvelope}
                  onChange={(e) => setTxEnvelope(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select Envelope (Optional)</option>
                  {envelopes.map((env) => (
                    <option key={env._id} value={env._id}>
                      {env.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Pay From Income Source Field (Visible only when Type is Expense) */}
            {txType === "expense" && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Pay From Income Source
                </label>
                <select
                  required
                  value={incomeSource}
                  onChange={(e) => setIncomeSource(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select Income Source (Optional)</option>
                  {transactions
                    .filter((t) => t.type === "income")
                    .map((inc) => (
                      <option key={inc._id} value={inc._id}>
                        {inc.title} ({symbol}
                        {formatAmount(inc.amount)})
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Purpose / Description */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Purpose / Notes
              </label>
              <input
                type="text"
                placeholder="Reason or notes..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Tax Settings for Expenses */}
            {txType === "expense" && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Tax Details
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Tax (%)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0%"
                      value={taxPercentage}
                      onChange={(e) => setTaxPercentage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Fixed Tax ({symbol})
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={taxAmount}
                      onChange={(e) => setTaxAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Tax Application
                  </label>
                  <select
                    value={taxApplication}
                    onChange={(e) => setTaxApplication(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="exclusive">
                      Exclusive (Added to amount)
                    </option>
                    <option value="inclusive">
                      Inclusive (Included in amount)
                    </option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg text-xs transition shadow-sm"
            >
              {editingTxId ? "Update Transaction" : "Add Transaction"}
            </button>
          </form>
        </div>

        {/* Envelope Manager Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold tracking-wide text-slate-200 mb-4">
            {editingEnvId ? "Edit Envelope" : "Create Envelope"}
          </h2>
          <form onSubmit={handleCreateEnvelope} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Envelope Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rent, Utilities"
                value={envName}
                onChange={(e) => setEnvName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Allocated Amount ({symbol})
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={envAmount}
                onChange={(e) => setEnvAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium py-2.5 rounded-lg text-xs transition border border-slate-700"
            >
              {editingEnvId ? "Update Envelope" : "Add Envelope"}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Transaction List & Envelopes Overview */}
      <div className="space-y-6 lg:col-span-2">
        {/* Envelopes Summary Grid */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold tracking-wide text-slate-200 mb-4">
            Budget Envelopes
          </h2>
          {envelopes.length === 0 ? (
            <p className="text-xs text-slate-500">No envelopes created yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {envelopes.map((env) => (
                <div
                  key={env._id}
                  className="bg-slate-950 border border-slate-800/80 p-3 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-200">
                      {env.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Allocated: {symbol}
                      {formatAmount(env.allocatedAmount)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateEnvelope(env._id)}
                      className="text-[11px] text-emerald-400 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEnvelope(env._id)}
                      className="text-[11px] text-rose-400 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transactions History Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold tracking-wide text-slate-200 mb-4">
            Transaction History
          </h2>

          {transactions.length === 0 ? (
            <p className="text-xs text-slate-500">
              No transactions recorded for this period.
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const isExpanded = expandedTxId === tx._id;
                return (
                  <div
                    key={tx._id}
                    className="bg-slate-950 border border-slate-800/80 rounded-lg p-3.5 space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2 h-2 rounded-full ${tx.type === "income" ? "bg-emerald-500" : "bg-rose-500"}`}
                        />
                        <div>
                          <p className="text-xs font-semibold text-slate-200">
                            {tx.title}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {tx.date
                              ? new Date(tx.date).toLocaleDateString()
                              : "Recent"}{" "}
                            •{" "}
                            <span className="uppercase">
                              {tx.paymentMethod || "cash"}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-bold ${tx.type === "income" ? "text-emerald-400" : "text-rose-400"}`}
                        >
                          {tx.type === "income" ? "+" : "-"}
                          {symbol}
                          {formatAmount(tx.amount)}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartEditTransaction(tx)}
                            className="text-[11px] text-emerald-400 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(tx._id)}
                            className="text-[11px] text-rose-400 hover:underline"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedTxId(isExpanded ? null : tx._id)
                            }
                            className="text-[11px] text-slate-400 hover:text-white"
                          >
                            {isExpanded ? "Less" : "Details"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details View */}
                    {isExpanded && (
                      <div className="pt-2 mt-2 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                        {tx.purpose && (
                          <p>
                            <strong className="text-slate-400">Purpose:</strong>{" "}
                            {tx.purpose}
                          </p>
                        )}
                        {tx.envelopeId && (
                          <p>
                            <strong className="text-slate-400">
                              Envelope:
                            </strong>{" "}
                            {typeof tx.envelopeId === "object"
                              ? tx.envelopeId.name
                              : "Linked"}
                          </p>
                        )}
                        {tx.incomeSource && (
                          <p>
                            <strong className="text-slate-400">
                              Funded From:
                            </strong>{" "}
                            {typeof tx.incomeSource === "object"
                              ? tx.incomeSource.title
                              : "Linked Income"}
                          </p>
                        )}
                        {(tx.taxAmount || tx.taxPercentage) && (
                          <p>
                            <strong className="text-slate-400">Tax:</strong>{" "}
                            {tx.taxPercentage ? `${tx.taxPercentage}%` : ""}{" "}
                            {tx.taxAmount
                              ? `(${symbol}${formatAmount(tx.taxAmount)})`
                              : ""}{" "}
                            [{tx.taxApplication}]
                          </p>
                        )}
                        {tx.updateLogs && tx.updateLogs.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-800">
                            <p className="font-semibold text-slate-400 mb-1">
                              Update History ({tx.updateLogs.length}):
                            </p>
                            {tx.updateLogs.map((log, idx) => (
                              <p
                                key={idx}
                                className="text-[10px] text-slate-400"
                              >
                                • {new Date(log.timestamp).toLocaleString()}:{" "}
                                {log.reason} (Before: {symbol}
                                {formatAmount(log.before)} → After: {symbol}
                                {formatAmount(log.after)})
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Maincontent;
