import React, { useState } from 'react'

const TansactionHistory = ({
  symbol,
  incomeTransactions,
  expenseTransactions,
  generalExpenses,
  envelopes,
  openDropdown,
  toggleDropdown,
  expandedTxId,
  toggleExpand,
  handleDeleteTransaction,
  formatAmount,
  startEditing,
}) => {
  // Local state to track which transaction's update history dropdown is open
  const [openHistoryId, setOpenHistoryId] = useState(null);

  const toggleHistoryDropdown = (txId, e) => {
    e.stopPropagation();
    setOpenHistoryId(openHistoryId === txId ? null : txId);
  };

  return (
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
                      <span className="font-bold text-emerald-400">+{symbol}{formatAmount(tx.amount)}</span>
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
                      <p><span className="text-slate-300 font-medium">Type:</span> Income</p>
                      <p><span className="text-slate-300 font-medium">Payment Method:</span> {tx.paymentMethod || 'Cash'}</p>
                      <p><span className="text-slate-300 font-medium">Transaction Date:</span> {tx.date ? new Date(tx.date).toLocaleDateString() : "N/A"}</p>
                      
                      {/* Income Update History Dropdown Button */}
                      {tx.updateLogs && tx.updateLogs.length > 0 && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={(e) => toggleHistoryDropdown(tx._id, e)}
                            className="w-full flex justify-between items-center px-3 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded text-amber-400 font-medium transition"
                          >
                            <span>Modification History ({tx.updateLogs.length})</span>
                            <span className="text-slate-400 text-xs">
                              {openHistoryId === tx._id ? "▲ Hide" : "▼ Show"}
                            </span>
                          </button>

                          {openHistoryId === tx._id && (
                            <div className="mt-2 bg-slate-950 p-2.5 rounded border border-slate-800 space-y-2">
                              {tx.updateLogs.map((log, index) => (
                                <div key={index} className="border-t border-slate-900 pt-1.5 first:border-t-0 first:pt-0 space-y-1 text-[11px]">
                                  <p className="text-[10px] text-slate-500 font-semibold">Update #{index + 1} — {new Date(log.timestamp).toLocaleString()}</p>
                                  
                                  {log.changes ? (
                                    Object.entries(log.changes).map(([field, data]) => (
                                      <div key={field} className="flex justify-between items-center text-slate-300 pl-2 border-l border-slate-800">
                                        <span className="capitalize font-medium text-slate-400">{field}:</span>
                                        <span>
                                          {field === 'amount' 
                                            ? `${symbol}${formatAmount(data.before)} → ${symbol}${formatAmount(data.after)}`
                                            : `${data.before || 'None'} → ${data.after || 'None'}`
                                          }
                                        </span>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="flex justify-between items-center text-slate-300">
                                      <span>Amount: {symbol}{formatAmount(log.before)} → {symbol}{formatAmount(log.after)}</span>
                                    </div>
                                  )}
                                  
                                  <p className="pl-2"><span className="text-slate-400">Reason:</span> {log.reason}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={(e) => startEditing(tx, e)}
                        className="text-sky-400 hover:text-sky-300 text-xs font-medium underline block pt-1"
                      >
                        Edit Transaction
                      </button>
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
                  envExpenses.map((tx) => {
                    const amt = Number(tx.amount) || 0;
                    const pct = tx.taxPercentage != null && tx.taxPercentage !== '' ? Number(tx.taxPercentage) : 0;
                    const tAmt = tx.taxAmount != null && tx.taxAmount !== '' ? Number(tx.taxAmount) : (pct ? (amt * pct) / 100 : 0);

                    const calculatedTaxVal = tAmt;
                    const calculatedBase = tx.taxApplication === 'exclusive' ? (amt - calculatedTaxVal) : (amt - (tx.taxAmount != null && tx.taxAmount !== '' ? Number(tx.taxAmount) : 0));

                    return (
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
                            <span className="font-bold text-rose-400">-{symbol}{formatAmount(tx.amount)}</span>
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
                            {(tx.taxAmount || tx.taxPercentage) && (
                              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1 text-xs">
                                <p className="text-slate-300 font-semibold uppercase tracking-wider text-[10px]">Tax Breakdown & Details:</p>
                                <div className="space-y-0.5 text-slate-400">
                                  <div className="flex justify-between">
                                    <span>Base Amount:</span>
                                    <span className="text-slate-200 font-medium">{symbol}{formatAmount(calculatedBase)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Tax Applied ({tx.taxApplication || 'exclusive'}):</span>
                                    <span className="text-rose-400 font-medium">
                                      +{symbol}{formatAmount(calculatedTaxVal)}
                                      {tx.taxPercentage ? ` (${tx.taxPercentage}%)` : ""}
                                    </span>
                                  </div>
                                  <div className="flex justify-between pt-1 border-t border-slate-800 font-semibold text-slate-200">
                                    <span>Total Amount Charged:</span>
                                    <span>{symbol}{formatAmount(tx.amount)}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            <p><span className="text-slate-300 font-medium">Payment Method:</span> {tx.paymentMethod || 'Cash'}</p>
                            <p><span className="text-slate-300 font-medium">Transaction Date:</span> {tx.date ? new Date(tx.date).toLocaleDateString() : "N/A"}</p>

                            {/* Modification History Dropdown Button */}
                            {tx.updateLogs && tx.updateLogs.length > 0 && (
                              <div className="pt-1">
                                <button
                                  type="button"
                                  onClick={(e) => toggleHistoryDropdown(tx._id, e)}
                                  className="w-full flex justify-between items-center px-3 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded text-amber-400 font-medium transition"
                                >
                                  <span>Modification History ({tx.updateLogs.length})</span>
                                  <span className="text-slate-400 text-xs">
                                    {openHistoryId === tx._id ? "▲ Hide" : "▼ Show"}
                                  </span>
                                </button>

                                {openHistoryId === tx._id && (
                                  <div className="mt-2 bg-slate-950 p-2.5 rounded border border-slate-800 space-y-2">
                                    {tx.updateLogs.map((log, index) => (
                                      <div key={index} className="border-t border-slate-900 pt-1.5 first:border-t-0 first:pt-0 space-y-1 text-[11px]">
                                        <p className="text-[10px] text-slate-500 font-semibold">Update #{index + 1} — {new Date(log.timestamp).toLocaleString()}</p>
                                        
                                        {log.changes ? (
                                          Object.entries(log.changes).map(([field, data]) => (
                                            <div key={field} className="flex justify-between items-center text-slate-300 pl-2 border-l border-slate-800">
                                              <span className="capitalize font-medium text-slate-400">{field}:</span>
                                              <span>
                                                {field === 'amount' 
                                                  ? `${symbol}${formatAmount(data.before)} → ${symbol}${formatAmount(data.after)}`
                                                  : `${data.before || 'None'} → ${data.after || 'None'}`
                                                }
                                              </span>
                                            </div>
                                          ))
                                        ) : (
                                          <div className="flex justify-between items-center text-slate-300">
                                            <span>Amount: {symbol}{formatAmount(log.before)} → {symbol}{formatAmount(log.after)}</span>
                                          </div>
                                        )}
                                        
                                        <p className="pl-2"><span className="text-slate-400">Reason:</span> {log.reason}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={(e) => startEditing(tx, e)}
                              className="text-sky-400 hover:text-sky-300 text-xs font-medium underline block pt-1"
                            >
                              Edit Transaction
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">
                            {tx.purpose ? `Purpose: ${tx.purpose} • ` : ""}Click to view details
                          </p>
                        )}
                      </div>
                    );
                  })
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
              {generalExpenses.map((tx) => {
                const amt = Number(tx.amount) || 0;
                const pct = tx.taxPercentage != null && tx.taxPercentage !== '' ? Number(tx.taxPercentage) : 0;
                const tAmt = tx.taxAmount != null && tx.taxAmount !== '' ? Number(tx.taxAmount) : (pct ? (amt * pct) / 100 : 0);

                const calculatedTaxVal = tAmt;
                const calculatedBase = tx.taxApplication === 'exclusive' ? (amt - calculatedTaxVal) : (amt - (tx.taxAmount != null && tx.taxAmount !== '' ? Number(tx.taxAmount) : 0));

                return (
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
                        <span className="font-bold text-rose-400">-{symbol}{formatAmount(tx.amount)}</span>
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
                          <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1 text-xs">
                            <p className="text-slate-300 font-semibold uppercase tracking-wider text-[10px]">Tax Breakdown & Details:</p>
                            <div className="space-y-0.5 text-slate-400">
                              <div className="flex justify-between">
                                <span>Base Amount:</span>
                                <span className="text-slate-200 font-medium">{symbol}{formatAmount(calculatedBase)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Tax Applied ({tx.taxApplication || 'exclusive'}):</span>
                                <span className="text-rose-400 font-medium">
                                  +{symbol}{formatAmount(calculatedTaxVal)}
                                  {tx.taxPercentage ? ` (${tx.taxPercentage}%)` : ""}
                                </span>
                              </div>
                              <div className="flex justify-between pt-1 border-t border-slate-800 font-semibold text-slate-200">
                                <span>Total Amount Charged:</span>
                                <span>{symbol}{formatAmount(tx.amount)}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <p><span className="text-slate-300 font-medium">Payment Method:</span> {tx.paymentMethod || 'Cash'}</p>
                        <p><span className="text-slate-300 font-medium">Transaction Date:</span> {tx.date ? new Date(tx.date).toLocaleDateString() : "N/A"}</p>

                        {/* Modification History Dropdown Button */}
                        {tx.updateLogs && tx.updateLogs.length > 0 && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={(e) => toggleHistoryDropdown(tx._id, e)}
                              className="w-full flex justify-between items-center px-3 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded text-amber-400 font-medium transition"
                            >
                              <span>Modification History ({tx.updateLogs.length})</span>
                              <span className="text-slate-400 text-xs">
                                {openHistoryId === tx._id ? "▲ Hide" : "▼ Show"}
                              </span>
                            </button>

                            {openHistoryId === tx._id && (
                              <div className="mt-2 bg-slate-950 p-2.5 rounded border border-slate-800 space-y-2">
                                {tx.updateLogs.map((log, index) => (
                                  <div key={index} className="border-t border-slate-900 pt-1.5 first:border-t-0 first:pt-0 space-y-1 text-[11px]">
                                    <p className="text-[10px] text-slate-500 font-semibold">Update #{index + 1} — {new Date(log.timestamp).toLocaleString()}</p>
                                    
                                    {log.changes ? (
                                      Object.entries(log.changes).map(([field, data]) => (
                                        <div key={field} className="flex justify-between items-center text-slate-300 pl-2 border-l border-slate-800">
                                          <span className="capitalize font-medium text-slate-400">{field}:</span>
                                          <span>
                                            {field === 'amount' 
                                              ? `${symbol}${formatAmount(data.before)} → ${symbol}${formatAmount(data.after)}`
                                              : `${data.before || 'None'} → ${data.after || 'None'}`
                                            }
                                          </span>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="flex justify-between items-center text-slate-300">
                                        <span>Amount: {symbol}{formatAmount(log.before)} → {symbol}{formatAmount(log.after)}</span>
                                      </div>
                                    )}
                                    
                                    <p className="pl-2"><span className="text-slate-400">Reason:</span> {log.reason}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={(e) => startEditing(tx, e)}
                          className="text-sky-400 hover:text-sky-300 text-xs font-medium underline block pt-1"
                        >
                          Edit Transaction
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Click to view details</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TansactionHistory;