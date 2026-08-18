import React from "react";

const Currency = ({
  loading,
  conversionRate,
  currency,
  setCurrency,
  incomeSource,
  setIncomeSource,
  showIncomeDropdown,
  setShowIncomeDropdown,
  transactions,
  envelopes = [], // Added envelopes with a safe default fallback
  formatAmount,
}) => {
  return (
    <div className="bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-800 w-full">
      {/* Main Container Wrapper */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 w-full">
        {/* Title & Description Section */}
        <div className="min-w-0 flex-1">
          <h1 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-white truncate">
            Expense Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
            Manage your budget, envelopes, and taxes seamlessly.
          </p>
        </div>

        {/* Controls Section (Rates, Currency Toggles, Income Source) */}
        <div className="flex flex-wrap items-center justify-start lg:justify-end gap-3 w-full lg:w-auto">
          {/* Live Rate Badge */}
          <div className="bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80 text-left lg:text-right shrink-0">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">
              Live Rate
            </p>
            <p className="text-xs font-semibold text-emerald-400">
              {loading
                ? "Updating..."
                : `1 USD = ${conversionRate ? conversionRate.toFixed(2) : "0.00"} PKR`}
            </p>
          </div>

          {/* Currency Toggle Buttons */}
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setCurrency("USD")}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                currency === "USD"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              USD ($)
            </button>
            <button
              type="button"
              onClick={() => setCurrency("PKR")}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                currency === "PKR"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              PKR (Rs)
            </button>
          </div>

          {/* Income Sources Dropdown & Active Badge Container */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowIncomeDropdown((s) => !s)}
                className="px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition bg-slate-800 text-emerald-400 hover:bg-slate-700 border border-slate-700 w-full sm:w-auto text-center shadow-sm"
              >
                {incomeSource ? "Change Envelope" : "Link Income Envelope"}
              </button>

              {/* Dropdown Menu */}
              {showIncomeDropdown && (
                <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-full sm:w-80 bg-slate-950 border border-slate-800 rounded-lg shadow-2xl z-50 overflow-hidden">
                  <div className="p-2 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800 bg-slate-900/50">
                    Available Envelopes
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {envelopes.length === 0 ? (
                      <div className="p-4 text-xs text-slate-500 italic text-center">
                        No envelopes found
                      </div>
                    ) : (
                      envelopes.map((env) => {
                        const consumed = transactions
                          .filter(
                            (t) =>
                              t.envelopeId?._id === env._id ||
                              t.envelopeId === env._id ||
                              t.envelope?._id === env._id ||
                              t.envelope === env._id,
                          )
                          .reduce((acc, t) => acc + t.amount, 0);
                        const remaining = (env.allocatedAmount || 0) - consumed;

                        return (
                          <button
                            key={env._id}
                            type="button"
                            onClick={() => {
                              setIncomeSource(env._id);
                              setShowIncomeDropdown(false);
                            }}
                            className="w-full text-left p-3 hover:bg-slate-900 border-b border-slate-900/80 last:border-0 transition"
                          >
                            <div className="flex justify-between items-center mb-1 gap-2">
                              <span className="text-xs font-medium text-slate-200 truncate">
                                {env.name}
                              </span>
                              <span className="text-[10px] text-emerald-400 font-bold shrink-0">
                                {currency === "PKR" ? "Rs " : "$"}
                                {formatAmount(remaining)} left
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Allocated: {currency === "PKR" ? "Rs " : "$"}
                              {formatAmount(env.allocatedAmount)}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Income Badge */}
            {incomeSource && (
              <div className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-900 flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto shrink-0 shadow-sm">
                <span className="truncate max-w-[220px]">
                  {envelopes.find((env) => env._id === incomeSource)?.name ||
                    "Envelope"}
                </span>
                <button
                  type="button"
                  onClick={() => setIncomeSource("")}
                  className="hover:text-white p-0.5 text-emerald-400 font-bold ml-1"
                  aria-label="Remove income envelope"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Currency;
