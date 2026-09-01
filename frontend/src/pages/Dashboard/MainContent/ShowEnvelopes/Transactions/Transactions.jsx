import React, { useEffect, useState } from "react";
import { fetchAllTransactions } from "../../../../../services/api";
import { getPeriodRangeLabel } from "../../../../../utils/period";

const Transactions = ({
  envelopes,
  selectedEnvelopeId,
  setSelectedEnvelopeId,
  symbol,
  formatAmount,
  handleUpdateEnvelope,
  handleDeleteEnvelope,
  isSubmitting,
  envelopesLoading,
  period = "all",
}) => {
  const [linkedTxs, setLinkedTxs] = useState([]);
  const [linkedLoading, setLinkedLoading] = useState(false);
  const [linkedError, setLinkedError] = useState("");
  const periodLabel = getPeriodRangeLabel(period);

  useEffect(() => {
    if (!selectedEnvelopeId || selectedEnvelopeId === "all") {
      setLinkedTxs([]);
      setLinkedError("");
      return undefined;
    }

    let cancelled = false;
    setLinkedLoading(true);
    setLinkedError("");

    fetchAllTransactions(period, {
      envelopeId: selectedEnvelopeId,
    })
      .then(({ transactions }) => {
        if (!cancelled) setLinkedTxs(transactions);
      })
      .catch(() => {
        if (!cancelled) {
          setLinkedTxs([]);
          setLinkedError("Could not load transactions for this envelope.");
        }
      })
      .finally(() => {
        if (!cancelled) setLinkedLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedEnvelopeId, period]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm w-full overflow-hidden">
      <h2 className="text-sm font-semibold tracking-wide text-slate-200 mb-4 truncate">
        Budget Envelopes (Expense)
      </h2>
      {envelopesLoading && (
        <div className="mb-3">
          <div className="inline-flex items-center gap-2 text-xs text-slate-400">
            <div className="h-3 w-3 rounded-full animate-spin border-2 border-emerald-400/30 border-t-emerald-400" />
            Loading envelopes...
          </div>
        </div>
      )}
      {envelopes.length === 0 ? (
        <p className="text-xs text-slate-500">
          No expense envelopes created yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {envelopes.map((env) => {
            const consumed = Number(env.consumed || 0);
            const computedCurrentBalance = Number(
              env.currentBalance ?? env.allocatedAmount ?? 0,
            );
            const remaining =
              env.currentBalance != null
                ? Number(env.currentBalance)
                : (env.allocatedAmount || 0) -
                  consumed +
                  Number(env.credited || 0);
            const isOpen = selectedEnvelopeId === env._id;

            return (
              <div
                key={env._id}
                onClick={() =>
                  !isSubmitting &&
                  setSelectedEnvelopeId(isOpen ? "all" : env._id)
                }
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
                      Available: {symbol}
                      {formatAmount(computedCurrentBalance)}
                    </p>
                  </div>
                  {handleUpdateEnvelope && handleDeleteEnvelope && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateEnvelope(env._id);
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
                          handleDeleteEnvelope(env._id);
                        }}
                        className="text-xs text-rose-400 hover:underline px-1 py-0.5 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
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
                      {formatAmount(remaining)}
                    </p>

                    <div className="pt-2 min-w-0">
                      <p className="font-semibold text-slate-400 mb-2 truncate">
                        Transactions in this envelope ({periodLabel}):
                      </p>
                      {linkedLoading ? (
                        <p className="text-xs text-slate-500">
                          Loading expenses...
                        </p>
                      ) : linkedError ? (
                        <p className="text-xs text-rose-400">{linkedError}</p>
                      ) : linkedTxs.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          No transactions linked yet for {periodLabel}.
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
                              <div
                                className={`text-xs font-semibold shrink-0 ${
                                  t.type === "income"
                                    ? "text-emerald-400"
                                    : "text-rose-400"
                                }`}
                              >
                                {t.type === "income" ? "+" : "-"}
                                {symbol}
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

export default React.memo(Transactions);
