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
  transactionFormRef,
  envelopeFormRef,
}) => {
  const [expandedTxId, setExpandedTxId] = useState(null);
  const [selectedEnvelopeId, setSelectedEnvelopeId] = useState(null);
  const symbol = currency === "PKR" ? "Rs " : "$";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 w-full max-w-full overflow-x-hidden">
      {/* Left Column: Forms (Transaction & Envelope Management) */}
      <div className="space-y-6 lg:col-span-1 w-full min-w-0">
        
        {/* Transaction Form Card */}
        <div ref={transactionFormRef} className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm w-full">
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
            {/* Type Switcher */}
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

            {/* Title */}
            <div className="min-w-0">
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

            {/* Amount */}
            <div className="min-w-0">
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

            {/* Envelope Selection (Visible only for Expense) */}
            {txType === "expense" && (
              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Budget Envelope
                </label>
                <select
                  required
                  value={txEnvelope}
                  onChange={(e) => setTxEnvelope(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 truncate"
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
            <div className="min-w-0">
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

            {/* Pay From Income Source Field (Visible only when Type is Expense) */}
            {txType === "expense" && (
              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Pay From Income Source
                </label>
                <select
                  required
                  value={incomeSource}
                  onChange={(e) => setIncomeSource(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 truncate"
                >
                  <option value="">Select Income Source (Optional)</option>
                  {transactions
                    .filter((t) => t.type === "income")
                    .map((inc) => {
                      const spent = transactions
                        .filter(
                          (t) =>
                            t.type === "expense" &&
                            (t.incomeSource?._id === inc._id ||
                              t.incomeSource === inc._id),
                        )
                        .reduce((acc, t) => acc + Number(t.amount || 0), 0);
                      const remaining = inc.amount - spent;

                      return (
                        <option key={inc._id} value={inc._id}>
                          {inc.title} ({symbol}
                          {formatAmount(remaining)} left)
                        </option>
                      );
                    })}
                </select>
              </div>
            )}

            {/* Purpose / Description */}
            <div className="min-w-0">
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

            {/* Date */}
            <div className="min-w-0">
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

            {/* Tax Settings for Expenses */}
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
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 sm:py-2.5 rounded-lg text-xs sm:text-sm transition shadow-sm"
            >
              {editingTxId ? "Update Transaction" : "Add Transaction"}
            </button>
          </form>
        </div>

        {/* Envelope Manager Form */}
        <div ref={envelopeFormRef} className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm w-full">
          <h2 className="text-sm font-semibold tracking-wide text-slate-200 mb-4 truncate">
            {editingEnvId ? "Edit Envelope" : "Create Envelope"}
          </h2>
          <form onSubmit={handleCreateEnvelope} className="space-y-4">
            <div className="min-w-0">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Envelope Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rent, Utilities"
                value={envName}
                onChange={(e) => setEnvName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="min-w-0">
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
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium py-3 sm:py-2.5 rounded-lg text-xs sm:text-sm transition border border-slate-700"
            >
              {editingEnvId ? "Update Envelope" : "Add Envelope"}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Transaction List & Envelopes Overview */}
      <div className="space-y-6 lg:col-span-2 w-full min-w-0">
        
        {/* Envelopes Summary Grid */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm w-full overflow-hidden">
          <h2 className="text-sm font-semibold tracking-wide text-slate-200 mb-4 truncate">
            Budget Envelopes
          </h2>
          {envelopes.length === 0 ? (
            <p className="text-xs text-slate-500">No envelopes created yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {envelopes.map((env) => {
                const envelopeExpenses = transactions.filter(
                  (t) =>
                    t.type === "expense" &&
                    ((t.envelopeId && t.envelopeId._id === env._id) ||
                      t.envelopeId === env._id),
                );
                const consumed = envelopeExpenses.reduce(
                  (acc, t) => acc + Number(t.amount || 0),
                  0,
                );

                const isOpen = selectedEnvelopeId === env._id;

                return (
                  <div
                    key={env._id}
                    onClick={() => setSelectedEnvelopeId(isOpen ? null : env._id)}
                    className={`bg-slate-950 border border-slate-800/80 p-3 sm:p-4 rounded-lg cursor-pointer transition min-w-0 ${
                      isOpen ? "ring-1 ring-emerald-500" : ""
                    }`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-semibold text-slate-200 truncate">
                          {env.name}
                        </p>
                        <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                          Allocated: {symbol}
                          {formatAmount(env.allocatedAmount)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateEnvelope(env._id);
                          }}
                          className="text-xs text-emerald-400 hover:underline px-1 py-0.5"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEnvelope(env._id);
                          }}
                          className="text-xs text-rose-400 hover:underline px-1 py-0.5"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300 space-y-2 min-w-0 overflow-hidden">
                        <p className="truncate">
                          <strong className="text-slate-400">Allocated:</strong> {symbol}
                          {formatAmount(env.allocatedAmount)}
                        </p>
                        <p className="truncate">
                          <strong className="text-slate-400">Consumed:</strong> {symbol}
                          {formatAmount(consumed)}
                        </p>
                        <p className="truncate">
                          <strong className="text-slate-400">Remaining:</strong> {symbol}
                          {formatAmount((env.allocatedAmount || 0) - consumed)}
                        </p>

                        <div className="pt-2 min-w-0">
                          <p className="font-semibold text-slate-400 mb-2 truncate">Expenses in this envelope:</p>
                          {envelopeExpenses.length === 0 ? (
                            <p className="text-xs text-slate-500">No expenses linked yet.</p>
                          ) : (
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                              {envelopeExpenses.map((t) => (
                                <div key={t._id} className="flex justify-between items-center gap-2 min-w-0">
                                  <div className="min-w-0 flex-1 pr-2">
                                    <p className="text-xs font-medium text-slate-200 truncate">{t.title}</p>
                                    <p className="text-[10px] text-slate-400">{t.date ? new Date(t.date).toLocaleDateString() : "-"}</p>
                                  </div>
                                  <div className="text-xs font-semibold text-rose-400 shrink-0">-{symbol}{formatAmount(t.amount)}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Transactions History Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm w-full overflow-hidden">
          <h2 className="text-sm font-semibold tracking-wide text-slate-200 mb-4 truncate">
            Transaction History
          </h2>

          {transactions.length === 0 ? (
            <p className="text-xs text-slate-500">
              No transactions recorded for this period.
            </p>
          ) : (
            <div className="space-y-3 min-w-0">
              {transactions.map((tx) => {
                const isExpanded = expandedTxId === tx._id;
                return (
                  <div
                    key={tx._id}
                    className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 sm:p-4 space-y-3 w-full min-w-0 overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 min-w-0">
                      
                      {/* Left Info Section */}
                      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        <span
                          className={`w-2.5 h-2.5 rounded-full mt-1 sm:mt-0 shrink-0 ${tx.type === "income" ? "bg-emerald-500" : "bg-rose-500"}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-semibold text-slate-200 truncate">
                            {tx.title}
                          </p>
                          <p className="text-[10px] sm:text-xs text-slate-400 truncate">
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

                      {/* Right Action Section */}
                      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 pt-2 sm:pt-0 border-t border-slate-900 sm:border-0 shrink-0">
                        <span
                          className={`text-xs sm:text-sm font-bold shrink-0 ${tx.type === "income" ? "text-emerald-400" : "text-rose-400"}`}
                        >
                          {tx.type === "income" ? "+" : "-"}
                          {symbol}
                          {formatAmount(tx.amount)}
                        </span>

                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartEditTransaction(tx)}
                            className="text-xs text-emerald-400 hover:underline py-1 px-1"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(tx._id)}
                            className="text-xs text-rose-400 hover:underline py-1 px-1"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedTxId(isExpanded ? null : tx._id)
                            }
                            className="text-xs text-slate-400 hover:text-white py-1 px-1"
                          >
                            {isExpanded ? "Less" : "Details"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details View */}
                    {isExpanded && (
                      <div className="pt-3 mt-2 border-t border-slate-800/80 text-xs text-slate-300 space-y-1.5 min-w-0 overflow-x-auto">
                        {tx.purpose && (
                          <p className="truncate">
                            <strong className="text-slate-400">Purpose:</strong>{" "}
                            {tx.purpose}
                          </p>
                        )}
                        {tx.envelopeId && (
                          <p className="truncate">
                            <strong className="text-slate-400">
                              Envelope:
                            </strong>{" "}
                            {typeof tx.envelopeId === "object"
                              ? tx.envelopeId.name
                              : "Linked"}
                          </p>
                        )}
                        {tx.incomeSource && (
                          <p className="truncate">
                            <strong className="text-slate-400">
                              Funded From:
                            </strong>{" "}
                            {typeof tx.incomeSource === "object"
                              ? tx.incomeSource.title
                              : "Linked Income"}
                          </p>
                        )}
                        {(tx.taxAmount || tx.taxPercentage) && (
                          <p className="truncate">
                            <strong className="text-slate-400">Tax:</strong>{" "}
                            {tx.taxPercentage ? `${tx.taxPercentage}%` : ""}{" "}
                            {tx.taxAmount
                              ? `(${symbol}${formatAmount(tx.taxAmount)})`
                              : ""}{" "}
                            [{tx.taxApplication}]
                          </p>
                        )}
                        {tx.updateLogs && tx.updateLogs.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-800 min-w-0">
                            <p className="font-semibold text-slate-400 mb-1">
                              Update History ({tx.updateLogs.length}):
                            </p>
                            {tx.updateLogs.map((log, idx) => (
                              <p
                                key={idx}
                                className="text-[10px] sm:text-xs text-slate-400 truncate"
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