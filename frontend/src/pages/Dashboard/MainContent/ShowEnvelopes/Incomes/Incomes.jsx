import React, { useEffect, useState } from "react";
import { fetchAllTransactions } from "../../../../../services/api";

const Incomes = ({
  incomeEnvelopes,
  selectedIncomeEnvId,
  setSelectedIncomeEnvId,
  symbol,
  formatAmount,
  handleUpdateIncomeEnvelope,
  handleDeleteIncomeEnvelope,
  isSubmitting,
  incomeEnvelopesLoading,
}) => {
  const [linkedTxs, setLinkedTxs] = useState([]);
  const [linkedLoading, setLinkedLoading] = useState(false);
  const [linkedError, setLinkedError] = useState("");

  useEffect(() => {
    if (!selectedIncomeEnvId) {
      setLinkedTxs([]);
      setLinkedError("");
      return undefined;
    }

    let cancelled = false;
    setLinkedLoading(true);
    setLinkedError("");

    fetchAllTransactions("all", {
      type: "income",
      incomeSource: selectedIncomeEnvId,
    })
      .then(({ transactions }) => {
        if (!cancelled) setLinkedTxs(transactions);
      })
      .catch(() => {
        if (!cancelled) {
          setLinkedTxs([]);
          setLinkedError("Could not load income for this envelope.");
        }
      })
      .finally(() => {
        if (!cancelled) setLinkedLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedIncomeEnvId]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm w-full overflow-hidden">
      <h2 className="text-sm font-semibold tracking-wide text-slate-200 mb-4 truncate">
        Income Envelopes
      </h2>
      {incomeEnvelopesLoading && (
        <div className="mb-3">
          <div className="inline-flex items-center gap-2 text-xs text-slate-400">
            <div className="h-3 w-3 rounded-full animate-spin border-2 border-emerald-400/30 border-t-emerald-400" />
            Loading income envelopes...
          </div>
        </div>
      )}
      {incomeEnvelopes.length === 0 ? (
        <p className="text-xs text-slate-500">
          No income envelopes created yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {incomeEnvelopes.map((inc) => {
            const spentFromInc = Number(inc.consumed || 0);
            const remainingInc =
              inc.currentBalance != null
                ? Number(inc.currentBalance)
                : Number(inc.allocatedAmount || 0) - spentFromInc;
            const isOpen = selectedIncomeEnvId === inc._id;

            return (
              <div
                key={inc._id}
                onClick={() =>
                  !isSubmitting &&
                  setSelectedIncomeEnvId(isOpen ? null : inc._id)
                }
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
                      className="text-xs text-emerald-400 hover:underline px-1 py-0.5 disabled:opacity-50"
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
                      className="text-xs text-rose-400 hover:underline px-1 py-0.5 disabled:opacity-50"
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

                    <div className="pt-2 min-w-0">
                      <p className="font-semibold text-slate-400 mb-2 truncate">
                        Incomes in this envelope:
                      </p>
                      {linkedLoading ? (
                        <p className="text-xs text-slate-500">
                          Loading income transactions...
                        </p>
                      ) : linkedError ? (
                        <p className="text-xs text-rose-400">{linkedError}</p>
                      ) : linkedTxs.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          No income transactions linked yet.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {linkedTxs.map((t) => (
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
