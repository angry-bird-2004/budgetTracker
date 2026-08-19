import React from "react";

const TransactionHistory = ({
  transactions,
  incomeEnvelopes,
  expandedTxId,
  setExpandedTxId,
  symbol,
  formatAmount,
  handleStartEditTransaction,
  handleDeleteTransaction,
}) => {
  return (
    <>
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
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      <span
                        className={`w-2.5 h-2.5 rounded-full mt-1 sm:mt-0 shrink-0 ${
                          tx.type === "income" ? "bg-emerald-500" : "bg-rose-500"
                        }`}
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

                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 pt-2 sm:pt-0 border-t border-slate-900 sm:border-0 shrink-0">
                      <span
                        className={`text-xs sm:text-sm font-bold shrink-0 ${
                          tx.type === "income"
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
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
                          <strong className="text-slate-400">Envelope:</strong>{" "}
                          {typeof tx.envelopeId === "object"
                            ? tx.envelopeId.name
                            : "Linked"}
                        </p>
                      )}
                      {(tx.incomeSource || tx.txIncomeEnvelope) && (
                        <p className="truncate">
                          <strong className="text-slate-400">
                            {tx.type === "income"
                              ? "Income Envelope:"
                              : "Funded From:"}
                          </strong>{" "}
                          {(() => {
                            const sourceRef =
                              tx.incomeSource || tx.txIncomeEnvelope;

                            // 1. If it's already a populated object, extract its name
                            if (
                              typeof sourceRef === "object" &&
                              sourceRef !== null
                            ) {
                              return (
                                sourceRef.name ||
                                sourceRef.title ||
                                sourceRef.envelopeName ||
                                "Linked Income"
                              );
                            }

                            // 2. Otherwise search inside incomeEnvelopes array by ID
                            const foundEnv = incomeEnvelopes?.find(
                              (e) => String(e._id) === String(sourceRef)
                            );

                            return foundEnv ? foundEnv.name : "Linked Income";
                          })()}
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
    </>
  );
};

export default TransactionHistory;