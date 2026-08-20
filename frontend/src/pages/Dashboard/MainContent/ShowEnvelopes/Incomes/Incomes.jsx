import React from "react";

const Incomes = ({
  incomeEnvelopes,
  transactions,
  selectedIncomeEnvId,
  setSelectedIncomeEnvId,
  symbol,
  formatAmount,
  handleUpdateIncomeEnvelope,
  handleDeleteIncomeEnvelope,
  isSubmitting,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm w-full overflow-hidden">
      <h2 className="text-sm font-semibold tracking-wide text-slate-200 mb-4 truncate">
        Income Envelopes
      </h2>
      {incomeEnvelopes.length === 0 ? (
        <p className="text-xs text-slate-500">
          No income envelopes created yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {incomeEnvelopes.map((inc) => {
            // Robustly check multiple possible property names for income envelope links
            const envelopeIncomes = transactions.filter((t) => {
              if (t.type !== "income") return false;

              const sourceRef =
                t.incomeSource || t.txIncomeEnvelope || t.envelopeId;
              const sourceId =
                typeof sourceRef === "object" && sourceRef !== null
                  ? sourceRef._id
                  : sourceRef;

              return String(sourceId) === String(inc._id);
            });

            // Calculate spent from source (expenses funded by this income envelope)
            const spentFromInc = transactions
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

            const remainingInc = inc.allocatedAmount - spentFromInc;
            const isOpen = selectedIncomeEnvId === inc._id;

            return (
              <div
                key={inc._id}
                onClick={() => !isSubmitting && setSelectedIncomeEnvId(isOpen ? null : inc._id)}
                className={`bg-slate-950 border border-slate-800/80 p-3 sm:p-4 rounded-lg cursor-pointer transition min-w-0 ${
                  isOpen ? "ring-1 ring-emerald-500" : ""
                } ${isSubmitting ? "opacity-70 pointer-events-none" : ""}`}
              >
                <div className="flex justify-between items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-slate-200 truncate">
                      {inc.name}
                    </p>
                    <p className="text-[11px] sm:text-xs text-emerald-400 truncate">
                      Total: {symbol}
                      {formatAmount(inc.allocatedAmount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateIncomeEnvelope(inc._id);
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
                        handleDeleteIncomeEnvelope(inc._id);
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
                      <strong className="text-slate-400">Total Income:</strong>{" "}
                      {symbol}
                      {formatAmount(inc.allocatedAmount)}
                    </p>
                    <p className="truncate">
                      <strong className="text-slate-400">
                        Spent from source:
                      </strong>{" "}
                      {symbol}
                      {formatAmount(spentFromInc)}
                    </p>
                    <p className="truncate">
                      <strong className="text-slate-400">
                        Remaining funds:
                      </strong>{" "}
                      {symbol}
                      {formatAmount(remainingInc)}
                    </p>

                    {/* Linked Income Transactions List */}
                    <div className="pt-2 min-w-0">
                      <p className="font-semibold text-slate-400 mb-2 truncate">
                        Incomes in this envelope:
                      </p>
                      {envelopeIncomes.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          No income transactions linked yet.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {envelopeIncomes.map((t) => (
                            <div
                              key={t._id}
                              className="flex justify-between items-center gap-2 min-w-0"
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <p className="text-xs font-medium text-slate-200 truncate">
                                  {t.title}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {t.date
                                    ? new Date(t.date).toLocaleDateString()
                                    : "-"}
                                </p>
                              </div>
                              <div className="text-xs font-semibold text-emerald-400 shrink-0">
                                +{symbol}
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
  );
};

export default Incomes;