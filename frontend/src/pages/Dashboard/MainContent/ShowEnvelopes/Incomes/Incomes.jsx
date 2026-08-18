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
}) => {
  return (
    <>
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
              const spentFromInc = transactions
                .filter(
                  (t) =>
                    t.type === "expense" &&
                    (t.incomeSource?._id === inc._id ||
                      t.incomeSource === inc._id),
                )
                .reduce((acc, t) => acc + Number(t.amount || 0), 0);
              const remainingInc = inc.allocatedAmount - spentFromInc;
              const isOpen = selectedIncomeEnvId === inc._id;

              return (
                <div
                  key={inc._id}
                  onClick={() =>
                    setSelectedIncomeEnvId(isOpen ? null : inc._id)
                  }
                  className={`bg-slate-950 border border-slate-800/80 p-3 sm:p-4 rounded-lg cursor-pointer transition min-w-0 ${
                    isOpen ? "ring-1 ring-emerald-500" : ""
                  }`}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateIncomeEnvelope(inc._id);
                        }}
                        className="text-xs text-emerald-400 hover:underline px-1 py-0.5"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteIncomeEnvelope(inc._id);
                        }}
                        className="text-xs text-rose-400 hover:underline px-1 py-0.5"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300 space-y-2 min-w-0">
                      <p className="truncate">
                        <strong className="text-slate-400">
                          Total Income:
                        </strong>{" "}
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

export default Incomes;
