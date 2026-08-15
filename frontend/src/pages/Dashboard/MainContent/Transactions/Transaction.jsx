import React, { useState } from "react";

const Transaction = ({
  handleCreateTransaction,
  handleUpdateTransaction,
  txTitle,
  setTxTitle,
  txAmount,
  setTxAmount,
  txType,
  setTxType,
  txEnvelope,
  setTxEnvelope,
  paymentMethod,
  setPaymentMethod,
  purpose,
  setPurpose,
  txDate,
  setTxDate,
  taxPercentage,
  setTaxPercentage,
  taxAmount,
  setTaxAmount,
  taxApplication,
  setTaxApplication, // Fixed typo from settaxApplication
  envelopes,
  transactions,
  handleDeleteTransaction,
}) => {
  // State to track which transaction's details are expanded
  const [expandedTxId, setExpandedTxId] = useState(null);
  
  // State to track which envelope dropdown is open (Envelope ID or "income" or "general")
  const [openDropdown, setOpenDropdown] = useState("income");

  // State to track which transaction is currently being edited
  const [editingTxId, setEditingTxId] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editReason, setEditReason] = useState("");

  // New states for advanced tax configuration during creation
  const [taxMode, setTaxMode] = useState("percentage"); // "percentage" or "fixed"

  const toggleExpand = (id) => {
    setExpandedTxId(expandedTxId === id ? null : id);
    if (expandedTxId !== id) {
      setEditingTxId(null);
    }
  };

  const toggleDropdown = (key) => {
    setOpenDropdown(openDropdown === key ? null : key);
  };

  const startEditing = (tx, e) => {
    e.stopPropagation();
    setEditingTxId(tx._id);
    setEditAmount(tx.amount);
    setEditReason("");
  };

  const cancelEditing = (e) => {
    e.stopPropagation();
    setEditingTxId(null);
    setEditAmount("");
    setEditReason("");
  };

  const submitEdit = (tx, e) => {
    e.stopPropagation();
    if (!editAmount || !editReason) {
      alert("Please enter the new amount and a reason for the change.");
      return;
    }

    const oldAmount = parseFloat(tx.amount);
    const newAmountNum = parseFloat(editAmount);
    const diff = newAmountNum - oldAmount;

    // Build the new single log entry to push into the array
    const newLogEntry = {
      before: oldAmount,
      after: newAmountNum,
      diff: diff,
      reason: editReason,
      timestamp: new Date(),
    };

    // Combine existing logs with the new entry
    const updatedLogs = tx.updateLogs ? [...tx.updateLogs, newLogEntry] : [newLogEntry];

    const updateData = {
      amount: newAmountNum,
      updateLogs: updatedLogs,
    };

    if (handleUpdateTransaction) {
      handleUpdateTransaction(tx._id, updateData);
    }

    setEditingTxId(null);
  };

  // Filter transactions
  const incomeTransactions = transactions.filter((tx) => tx.type === "income");
  const expenseTransactions = transactions.filter((tx) => tx.type === "expense");

  // Separate general expenses from envelope-specific expenses
  const generalExpenses = expenseTransactions.filter(
    (tx) => !tx.envelopeId && !tx.envelope
  );

  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-6">
      <h3 className="text-xl font-bold">Add Transaction</h3>
      
      <form onSubmit={handleCreateTransaction} className="space-y-4">
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
            placeholder="Amount ($)"
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
                <option value="fixed">Tax by Fixed Amount ($)</option>
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
                  placeholder="Fixed Tax Amount ($)"
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
            type="datetime-local"
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
          Save Transaction
        </button>
      </form>

      {/* Dropdown Sections for Transactions */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <h4 className="font-semibold text-slate-300 text-sm uppercase tracking-wider">Transaction History</h4>

        {/* 1. Income Dropdown */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleDropdown("income")}
            className="w-full flex justify-between items-center p-4 bg-slate-950 hover:bg-slate-900 transition text-left"
          >
            <span className="font-semibold text-emerald-400 text-sm flex items-center gap-2">
              Income 
              <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                {incomeTransactions.length}
              </span>
            </span>
            <span className="text-slate-400 text-xs">
              {openDropdown === "income" ? "▲ Hide" : "▼ Show"}
            </span>
          </button>

          {openDropdown === "income" && (
            <div className="p-3 border-t border-slate-800 space-y-2 max-h-48 overflow-y-auto">
              {incomeTransactions.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-2">No income recorded.</p>
              ) : (
                incomeTransactions.map((tx) => (
                  <div
                    key={tx._id}
                    className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1 cursor-pointer hover:border-slate-700 transition"
                    onClick={() => toggleExpand(tx._id)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{tx.title}</p>
                        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 uppercase">
                          {tx.paymentMethod || 'cash'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-400">+${tx.amount}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTransaction(tx._id);
                          }}
                          className="text-rose-500 text-xs hover:text-rose-300"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {expandedTxId === tx._id ? (
                      <div className="text-xs text-slate-400 pt-2 border-t border-slate-800 space-y-1">
                        <p><span className="text-slate-300 font-medium">Type:</span> Income</p>
                        <p><span className="text-slate-300 font-medium">Payment Method:</span> {tx.paymentMethod || 'Cash'}</p>
                        <p><span className="text-slate-300 font-medium">Transaction Date/Time:</span> {tx.date ? new Date(tx.date).toLocaleString() : "N/A"}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Income • Click to view details</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 2. Envelope Expenses Dropdowns */}
        {envelopes.map((env) => {
          const envExpenses = expenseTransactions.filter(
            (tx) =>
              tx.envelopeId?._id === env._id ||
              tx.envelopeId === env._id ||
              tx.envelope === env._id
          );

          return (
            <div key={env._id} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleDropdown(env._id)}
                className="w-full flex justify-between items-center p-4 bg-slate-950 hover:bg-slate-900 transition text-left"
              >
                <span className="font-semibold text-rose-400 text-sm flex items-center gap-2">
                  Envelope: {env.name}
                  <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                    {envExpenses.length}
                  </span>
                </span>
                <span className="text-slate-400 text-xs">
                  {openDropdown === env._id ? "▲ Hide" : "▼ Show"}
                </span>
              </button>

              {openDropdown === env._id && (
                <div className="p-3 border-t border-slate-800 space-y-2 max-h-48 overflow-y-auto">
                  {envExpenses.length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-2">No expenses for this envelope.</p>
                  ) : (
                    envExpenses.map((tx) => (
                      <div
                        key={tx._id}
                        className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1 cursor-pointer hover:border-slate-700 transition"
                        onClick={() => toggleExpand(tx._id)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{tx.title}</p>
                            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 uppercase">
                              {tx.paymentMethod || 'cash'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-rose-400">-${tx.amount}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTransaction(tx._id);
                              }}
                              className="text-rose-500 text-xs hover:text-rose-300"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {expandedTxId === tx._id ? (
                          <div className="text-xs text-slate-400 pt-2 border-t border-slate-800 space-y-2">
                            <p><span className="text-slate-300 font-medium">Envelope:</span> {env.name}</p>
                            {tx.purpose && <p><span className="text-slate-300 font-medium">Purpose:</span> {tx.purpose}</p>}
                            
                            {/* Detailed Tax View */}
                            {/* Detailed Tax View */}
{(tx.taxAmount || tx.taxPercentage) && (
  <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1 text-xs">
    <p className="text-slate-300 font-semibold uppercase tracking-wider text-[10px]">Tax Breakdown & Details:</p>
    
    <div className="space-y-0.5 text-slate-400">
      <div className="flex justify-between">
        <span>Base Amount:</span>
        <span className="text-slate-200 font-medium">
          ${
            tx.taxApplication === 'exclusive'
              ? (tx.amount - (tx.taxAmount || (tx.amount * (tx.taxPercentage / 100)))).toFixed(2)
              : (tx.amount - (tx.taxAmount || 0)).toFixed(2)
          }
        </span>
      </div>

      <div className="flex justify-between">
        <span>Tax Applied ({tx.taxApplication || 'exclusive'}):</span>
        <span className="text-rose-400 font-medium">
          +${tx.taxAmount ? tx.taxAmount : ((tx.amount * tx.taxPercentage) / 100).toFixed(2)}
          {tx.taxPercentage ? ` (${tx.taxPercentage}%)` : ""}
        </span>
      </div>

      <div className="flex justify-between pt-1 border-t border-slate-800 font-semibold text-slate-200">
        <span>Total Amount Charged:</span>
        <span>${tx.amount}</span>
      </div>
    </div>
  </div>
)}

                            <p><span className="text-slate-300 font-medium">Transaction Date:</span> {tx.date ? new Date(tx.date).toLocaleString() : "N/A"}</p>

                            {/* Multi-Update Audit Logs */}
                            {tx.updateLogs && tx.updateLogs.length > 0 && (
                              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-2">
                                <p className="text-amber-400 font-medium text-xs">Amount Modification History ({tx.updateLogs.length}):</p>
                                {tx.updateLogs.map((log, index) => (
                                  <div key={index} className="border-t border-slate-900 pt-1.5 space-y-0.5 text-[11px]">
                                    <div className="flex justify-between items-center text-slate-300">
                                      <span>Update #{index + 1}: ${log.before} → ${log.after}</span>
                                      <span className={log.diff >= 0 ? "text-emerald-400 font-medium" : "text-rose-400 font-medium"}>
                                        {log.diff >= 0 ? `+${log.diff}` : log.diff}
                                      </span>
                                    </div>
                                    <p><span className="text-slate-400">Reason:</span> {log.reason}</p>
                                    <p className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Edit Section */}
                            {editingTxId === tx._id ? (
                              <div className="bg-slate-950 p-3 rounded border border-slate-700 space-y-2" onClick={(e) => e.stopPropagation()}>
                                <p className="font-medium text-slate-200">Change Expense Amount</p>
                                <input
                                  type="number"
                                  placeholder="New Amount ($)"
                                  value={editAmount}
                                  onChange={(e) => setEditAmount(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                                />
                                <input
                                  type="text"
                                  placeholder="Reason for changing amount"
                                  value={editReason}
                                  onChange={(e) => setEditReason(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                                />
                                <div className="flex gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={(e) => submitEdit(tx, e)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs font-medium"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditing}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded text-xs"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => startEditing(tx, e)}
                                className="text-sky-400 hover:text-sky-300 text-xs font-medium underline block pt-1"
                              >
                                Edit Amount
                              </button>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">
                            {tx.purpose ? `Purpose: ${tx.purpose} • ` : ""}Click to view details
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* 3. General / Unassigned Expenses Dropdown */}
        {generalExpenses.length > 0 && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleDropdown("general")}
              className="w-full flex justify-between items-center p-4 bg-slate-950 hover:bg-slate-900 transition text-left"
            >
              <span className="font-semibold text-rose-400 text-sm flex items-center gap-2">
                General Expenses (Unassigned)
                <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                  {generalExpenses.length}
                </span>
              </span>
              <span className="text-slate-400 text-xs">
                {openDropdown === "general" ? "▲ Hide" : "▼ Show"}
              </span>
            </button>

            {openDropdown === "general" && (
              <div className="p-3 border-t border-slate-800 space-y-2 max-h-48 overflow-y-auto">
                {generalExpenses.map((tx) => (
                  <div
                    key={tx._id}
                    className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1 cursor-pointer hover:border-slate-700 transition"
                    onClick={() => toggleExpand(tx._id)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{tx.title}</p>
                        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 uppercase">
                          {tx.paymentMethod || 'cash'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-rose-400">-${tx.amount}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTransaction(tx._id);
                          }}
                          className="text-rose-500 text-xs hover:text-rose-300"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {expandedTxId === tx._id ? (
                      <div className="text-xs text-slate-400 pt-2 border-t border-slate-800 space-y-2">
                        <p><span className="text-slate-300 font-medium">Envelope:</span> General</p>
                        {tx.purpose && <p><span className="text-slate-300 font-medium">Purpose:</span> {tx.purpose}</p>}
                        
                        {(tx.taxAmount || tx.taxPercentage) && (
                          <div className="bg-slate-950 p-2 rounded border border-slate-800 space-y-0.5">
                            <p className="text-slate-300 font-medium">Tax Breakdown:</p>
                            <p>
                              {tx.taxPercentage ? `Rate: ${tx.taxPercentage}%` : ""} 
                              {tx.taxAmount ? ` • Tax Value: $${tx.taxAmount}` : ""}
                              {tx.taxApplication ? ` (${tx.taxApplication})` : ""}
                            </p>
                          </div>
                        )}

                        <p><span className="text-slate-300 font-medium">Transaction Date:</span> {tx.date ? new Date(tx.date).toLocaleString() : "N/A"}</p>

                        {tx.updateLogs && tx.updateLogs.length > 0 && (
                          <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-2">
                            <p className="text-amber-400 font-medium text-xs">Amount Modification History ({tx.updateLogs.length}):</p>
                            {tx.updateLogs.map((log, index) => (
                              <div key={index} className="border-t border-slate-900 pt-1.5 space-y-0.5 text-[11px]">
                                <div className="flex justify-between items-center text-slate-300">
                                  <span>Update #{index + 1}: ${log.before} → ${log.after}</span>
                                  <span className={log.diff >= 0 ? "text-emerald-400 font-medium" : "text-rose-400 font-medium"}>
                                    {log.diff >= 0 ? `+${log.diff}` : log.diff}
                                  </span>
                                </div>
                                <p><span className="text-slate-400">Reason:</span> {log.reason}</p>
                                <p className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {editingTxId === tx._id ? (
                          <div className="bg-slate-950 p-3 rounded border border-slate-700 space-y-2" onClick={(e) => e.stopPropagation()}>
                            <p className="font-medium text-slate-200">Change Expense Amount</p>
                            <input
                              type="number"
                              placeholder="New Amount ($)"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Reason for changing amount"
                              value={editReason}
                              onChange={(e) => setEditReason(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                            />
                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                onClick={(e) => submitEdit(tx, e)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs font-medium"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditing}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => startEditing(tx, e)}
                            className="text-sky-400 hover:text-sky-300 text-xs font-medium underline block pt-1"
                          >
                            Edit Amount
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Click to view details</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Transaction;