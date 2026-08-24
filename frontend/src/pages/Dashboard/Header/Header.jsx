import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getPeriodRangeLabel } from "../../../utils/period";

const Header = ({
  totalIncome,
  totalExpense = 0,
  totalTax = 0,
  currency = "USD",
  formatAmount,
  incomeEnvelopes = [],
  period = "all",
}) => {
  const [selectedEnvelopeId, setSelectedEnvelopeId] = useState("all");
  const symbol = currency === "PKR" ? "Rs " : "$";
  const periodLabel = getPeriodRangeLabel(period);

  const isAll = selectedEnvelopeId === "all";

  const selectedEnv = incomeEnvelopes.find((e) => e._id === selectedEnvelopeId);

  const sumOfIncomeEnvelopes = incomeEnvelopes.reduce(
    (acc, env) => acc + Number(env.allocatedAmount || 0),
    0
  );

  const overallIncome = Math.max(totalIncome, sumOfIncomeEnvelopes);

  const displayIncome = isAll
    ? overallIncome
    : Number(selectedEnv?.allocatedAmount || 0);

  const displayExpense = isAll
    ? Number(totalExpense || 0)
    : Number(selectedEnv?.consumed || 0);

  const displayTax = isAll
    ? Number(totalTax || 0)
    : Number(selectedEnv?.tax || 0);

  const displaySavings = displayIncome - displayExpense;

  return (
    <div className="space-y-4">
      {/* Filter Selector Bar */}
      <div className="bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            View Analytics For:
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedEnvelopeId("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
              isAll
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            All Totals
          </button>
          {incomeEnvelopes.map((env) => {
            const isSelected = selectedEnvelopeId === env._id;
            return (
              <button
                key={env._id}
                type="button"
                onClick={() => setSelectedEnvelopeId(env._id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 truncate max-w-[150px] ${
                  isSelected
                    ? "bg-emerald-600 text-white shadow-md"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
                title={env.name}
              >
                {env.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 transition shadow-sm">
          <p className="text-slate-400 text-sm font-medium">
            {isAll ? "Total Income" : "Envelope Pool"}
          </p>
          <h3 className="text-3xl font-bold text-emerald-400 mt-2">
            {symbol}
            {formatAmount(displayIncome)}
          </h3>
          <p className="text-[10px] text-slate-500 mt-1 truncate">
            {isAll
              ? `Posted income (${periodLabel})`
              : `Allocated in: ${selectedEnv?.name} (all-time)`}
          </p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 transition shadow-sm">
          <p className="text-slate-400 text-sm font-medium">
            {isAll ? "Total Expenses" : "Envelope Expenses"}
          </p>
          <h3 className="text-3xl font-bold text-rose-400 mt-2">
            {symbol}
            {formatAmount(displayExpense)}
          </h3>
          <p className="text-[10px] text-slate-500 mt-1 truncate">
            {isAll
              ? `Posted expenses (${periodLabel})`
              : "Spent from this income envelope (all-time)"}
          </p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 transition shadow-sm">
          <p className="text-slate-400 text-sm font-medium">
            {isAll ? "Total Tax Paid" : "Envelope Tax Paid"}
          </p>
          <h3 className="text-3xl font-bold text-amber-400 mt-2">
            {symbol}
            {formatAmount(displayTax)}
          </h3>
          <p className="text-[10px] text-slate-500 mt-1 truncate">
            {isAll
              ? `Tax in posted expenses (${periodLabel})`
              : "Tax from linked expenses (all-time)"}
          </p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 transition shadow-sm">
          <p className="text-slate-400 text-sm font-medium">
            {isAll ? "Net Savings" : "Envelope Net Remaining"}
          </p>
          <h3
            className={`text-3xl font-bold mt-2 ${
              displaySavings >= 0 ? "text-indigo-400" : "text-rose-500"
            }`}
          >
            {symbol}
            {formatAmount(displaySavings)}
          </h3>
          <p className="text-[10px] text-slate-500 mt-1 truncate">
            {isAll
              ? `Income minus expenses (${periodLabel})`
              : "Pool minus envelope expenses (all-time)"}
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm transition duration-200 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-950/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Insights</p>
            <h3 className="text-sm font-semibold text-slate-100">Open the full analytics dashboard</h3>
          </div>
          <Link
            to="/analytics"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
          >
            View detailed analytics
          </Link>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Income</p>
            <p className="mt-2 text-lg font-bold text-emerald-400">{symbol}{formatAmount(Math.max(displayIncome, totalIncome))}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Spent</p>
            <p className="mt-2 text-lg font-bold text-rose-400">{symbol}{formatAmount(displayExpense)}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Net</p>
            <p className={`mt-2 text-lg font-bold ${displaySavings >= 0 ? "text-indigo-400" : "text-rose-500"}`}>
              {symbol}{formatAmount(displaySavings)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
