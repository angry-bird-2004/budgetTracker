import React, { useMemo } from "react";

const Transactions = ({
  envelopes,
  transactions,
  selectedEnvelopeId,
  setSelectedEnvelopeId,
  symbol,
  formatAmount,
  handleUpdateEnvelope,
  handleDeleteEnvelope,
  isSubmitting,
}) => {
  // Group transactions by envelope id to avoid repeated O(n*m) filters on render
  const transactionsByEnvelope = useMemo(() => {
    const map = Object.create(null);
    if (!Array.isArray(transactions) || transactions.length === 0) return map;
    for (const t of transactions) {
      if (t.type !== 'expense') continue;
      const sourceRef = t.envelopeId || t.txExpenseEnvelope;
      const sourceId = typeof sourceRef === 'object' && sourceRef !== null ? sourceRef._id : sourceRef;
      const key = String(sourceId || '');
      if (!map[key]) map[key] = [];
      map[key].push(t);
    }
    return map;
  }, [transactions]);

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm w-full overflow-hidden">
        <h2 className="text-sm font-semibold tracking-wide text-slate-200 mb-4 truncate">
          Budget Envelopes (Expense)
        </h2>
        {envelopes.length === 0 ? (
          <p className="text-xs text-slate-500">
            No expense envelopes created yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {envelopes.map((env) => {
              const envelopeExpenses = transactionsByEnvelope[String(env._id)] || [];

              const consumed = envelopeExpenses.reduce((acc, t) => acc + Number(t.amount || 0), 0);
              const isOpen = selectedEnvelopeId === env._id;

              return (
                <div
                  key={env._id}
                  onClick={() => !isSubmitting && setSelectedEnvelopeId(isOpen ? null : env._id)}
                  className={`bg-slate-950 border border-slate-800/80 p-3 sm:p-4 rounded-lg cursor-pointer transition min-w-0 ${
                    isOpen ? "ring-1 ring-emerald-500" : ""
                  } ${isSubmitting ? "opacity-70 pointer-events-none" : ""}`}
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
                        disabled={isSubmitting}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateEnvelope(env._id);
                        }}
                        className="text-xs text-emerald-400 hover:underline px-1 py-0.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEnvelope(env._id);
                        }}
                        className="text-xs text-rose-400 hover:underline px-1 py-0.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300 space-y-2 min-w-0">
                      <p className="truncate">
                        <strong className="text-slate-400">Allocated:</strong>{" "}
                        {symbol}
                        {formatAmount(env.allocatedAmount)}
                      </p>
                      <p className="truncate">
                        <strong className="text-slate-400">Consumed:</strong>{" "}
                        {symbol}
                        {formatAmount(consumed)}
                      </p>
                      <p className="truncate">
                        <strong className="text-slate-400">Remaining:</strong>{" "}
                        {symbol}
                        {formatAmount((env.allocatedAmount || 0) - consumed)}
                      </p>

                      <div className="pt-2 min-w-0">
                        <p className="font-semibold text-slate-400 mb-2 truncate">
                          Expenses in this envelope:
                        </p>
                        {envelopeExpenses.length === 0 ? (
                          <p className="text-xs text-slate-500">
                            No expenses linked yet.
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {envelopeExpenses.map((t) => (
                              <div
                                key={t._id}
                                className="flex justify-between items-center gap-2 min-w-0"
                              >
                                <div className="min-w-0 flex-1 pr-2">
                                  <p className="text-xs font-medium text-slate-200 truncate">
                                    {t.title}
                                  </p>
                                          <p className="text-[10px] text-slate-400">
                                            {t.date ? new Date(t.date).toLocaleDateString() : "-"}
                                          </p>
                                </div>
                                <div className="text-xs font-semibold text-rose-400 shrink-0">
                                  -{symbol}
                                  {formatAmount(t.amount)}
                                </div>
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
    </>
  );
};

export default React.memo(Transactions);