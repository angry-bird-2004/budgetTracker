import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchAllTransactions, fetchIncomeEnvelopes } from "../../../services/api";

const AnalyticsPage = () => {
  const [analyticsState] = useState(() => {
    try {
      const raw = localStorage.getItem("budgetTrackerAnalyticsData");
      if (!raw) {
        return {
          transactions: [],
          incomeEnvelopes: [],
          currency: "USD",
          conversionRate: 280,
          // compatibility: older compact summary fields
          transactionCount: 0,
          totalIncome: 0,
          totalExpense: 0,
          totalTax: 0,
          incomeEnvelopeCount: 0,
        };
      }

      const parsed = JSON.parse(raw);
      return parsed;
    } catch {
      localStorage.removeItem("budgetTrackerAnalyticsData");
      return {
        transactions: [],
        incomeEnvelopes: [],
        currency: "USD",
        conversionRate: 280,
      };
    }
  });

  // analyticsState may be either a full payload (transactions/incomeEnvelopes)
  // or the compact summary produced by Dashboard. Normalize below.
  const {
    incomeEnvelopes = [],
    currency = 'USD',
    conversionRate = 280,
    transactionCount = 0,
    totalIncome: compactTotalIncome,
    totalExpense: compactTotalExpense,
    totalTax: compactTotalTax,
    incomeEnvelopeCount = 0,
  } = analyticsState;

  const [fetchedTransactions, setFetchedTransactions] = useState([]);
  const [fetchedIncomeEnvelopes, setFetchedIncomeEnvelopes] = useState([]);
  const [fetchedTotals, setFetchedTotals] = useState(null);

  const effectiveTransactions = fetchedTransactions;
  const effectiveIncomeEnvelopes = fetchedIncomeEnvelopes.length > 0
    ? fetchedIncomeEnvelopes
    : (Array.isArray(incomeEnvelopes) ? incomeEnvelopes : []);

  const symbol = currency === "PKR" ? "Rs " : "$";

  const formatAmount = (value) => {
    const num = Number(value) || 0;
    const converted = currency === "PKR" ? num : num / conversionRate;
    return converted.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const trendData = useMemo(() => {
    if (!Array.isArray(effectiveTransactions) || effectiveTransactions.length === 0) return [];
    return Array.from({ length: 6 }, (_, idx) => {
      const now = new Date();
      const end = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
      const start = new Date(end.getFullYear(), end.getMonth(), 1);
      const monthLabel = end.toLocaleDateString("en-US", { month: "short" });

      const income = effectiveTransactions
        .filter((tx) => {
          if (tx.type !== "income") return false;
          if (!tx.date) return false;
          const date = new Date(tx.date);
          return date >= start && date < new Date(end.getFullYear(), end.getMonth() + 1, 1);
        })
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

      const expense = effectiveTransactions
        .filter((tx) => {
          if (tx.type !== "expense") return false;
          if (!tx.date) return false;
          const date = new Date(tx.date);
          return date >= start && date < new Date(end.getFullYear(), end.getMonth() + 1, 1);
        })
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

      return { monthLabel, income, expense };
    });
  }, [effectiveTransactions]);

  // If compact summary provided totals, use them; otherwise compute from transactions
  const computedTotalIncome = useMemo(() => {
    if (typeof fetchedTotals?.income === "number") return fetchedTotals.income;
    if (typeof compactTotalIncome === "number") return compactTotalIncome;
    return (effectiveTransactions || []).filter((tx) => tx.type === "income").reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  }, [effectiveTransactions, compactTotalIncome, fetchedTotals]);

  const computedTotalExpense = useMemo(() => {
    if (typeof fetchedTotals?.expense === "number") return fetchedTotals.expense;
    if (typeof compactTotalExpense === "number") return compactTotalExpense;
    return (effectiveTransactions || []).filter((tx) => tx.type === "expense").reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  }, [effectiveTransactions, compactTotalExpense, fetchedTotals]);

  const computedTotalTax = useMemo(() => {
    if (typeof fetchedTotals?.tax === "number") return fetchedTotals.tax;
    if (typeof compactTotalTax === "number") return compactTotalTax;
    return (effectiveTransactions || []).filter((tx) => tx.type === "expense").reduce((sum, tx) => {
      if (tx.taxAmount) return sum + Number(tx.taxAmount || 0);
      if (tx.taxPercentage && tx.amount) {
        return sum + (Number(tx.amount || 0) * Number(tx.taxPercentage || 0)) / 100;
      }
      return sum;
    }, 0);
  }, [effectiveTransactions, compactTotalTax, fetchedTotals]);

  const totalAllocatedIncome = useMemo(() => (effectiveIncomeEnvelopes || []).reduce((sum, env) => sum + Number(env.allocatedAmount || 0), 0), [effectiveIncomeEnvelopes]);

  const maxTrendValue = Math.max(1, ...trendData.flatMap((point) => [point.income, point.expense]));

  const overviewCards = [
    { label: 'Income', value: computedTotalIncome, tone: 'emerald' },
    { label: 'Expenses', value: computedTotalExpense, tone: 'rose' },
    { label: 'Tax', value: computedTotalTax, tone: 'amber' },
    { label: 'Net', value: computedTotalIncome - computedTotalExpense, tone: 'indigo' },
  ];

  const hasData = (Array.isArray(effectiveTransactions) && effectiveTransactions.length > 0) || (Array.isArray(effectiveIncomeEnvelopes) && effectiveIncomeEnvelopes.length > 0) || (transactionCount && transactionCount > 0) || (incomeEnvelopeCount && incomeEnvelopeCount > 0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [txResult, incomeRes] = await Promise.all([
          fetchAllTransactions("all"),
          fetchIncomeEnvelopes(),
        ]);
        if (cancelled) return;
        setFetchedTransactions(txResult.transactions);
        setFetchedTotals(txResult.totals);
        if (Array.isArray(incomeRes.data)) {
          setFetchedIncomeEnvelopes(incomeRes.data);
        }
      } catch (e) {
        console.warn("Analytics fetch failed:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300">
            <Link to="/" className="text-emerald-400 hover:text-emerald-300 transition">← Back to dashboard</Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-slate-950/30">
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Overview</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Financial Analytics</h1>
          <p className="mt-1 text-sm text-slate-400">
            Your recent income, spending, and savings pattern across the last six months.
          </p>
        </div>

        {!hasData ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-8 text-center shadow-xl shadow-slate-950/20">
            <p className="text-lg font-semibold text-white">No analytics data yet</p>
            <p className="mt-2 text-sm text-slate-400">
              Add an income or expense transaction, or create a budget envelope to unlock the analytics view.
            </p>
            <Link to="/" className="mt-4 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500">
              Go to dashboard
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {overviewCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-950/20"
                >
                  <p className="text-sm text-slate-400">{card.label}</p>
                  <p className={`mt-3 text-3xl font-bold ${
                    card.tone === "emerald"
                      ? "text-emerald-400"
                      : card.tone === "rose"
                        ? "text-rose-400"
                        : card.tone === "amber"
                          ? "text-amber-400"
                          : "text-indigo-400"
                  }`}>
                    {symbol}
                    {formatAmount(card.value)}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-slate-950/20">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Trend</p>
                  <h2 className="text-lg font-semibold text-white">Income vs Expense</h2>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Income</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-rose-400" /> Expense</span>
                </div>
              </div>

              <svg viewBox="0 0 320 170" className="h-52 w-full" preserveAspectRatio="none" role="img" aria-label="Historical income and expense chart">
                {[0, 0.25, 0.5, 0.75, 1].map((step) => (
                  <line
                    key={step}
                    x1="0"
                    y1={20 + step * 120}
                    x2="320"
                    y2={20 + step * 120}
                    stroke="rgba(148,163,184,0.15)"
                    strokeDasharray="5 8"
                  />
                ))}

                {trendData.map((point, index) => {
                  const x = (index / (trendData.length - 1)) * 280 + 20;
                  const incomeY = 140 - (point.income / maxTrendValue) * 95;
                  const expenseY = 140 - (point.expense / maxTrendValue) * 95;

                  return (
                    <g key={point.monthLabel}>
                      <circle cx={x} cy={incomeY} r="4" fill="#34d399" />
                      <circle cx={x} cy={expenseY} r="4" fill="#f87171" />
                      <text x={x} y="158" textAnchor="middle" fill="#94a3b8" fontSize="10">{point.monthLabel}</text>
                    </g>
                  );
                })}

                <polyline
                  className="chart-line"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="3"
                  points={trendData
                    .map((point, index) => {
                      const x = (index / (trendData.length - 1)) * 280 + 20;
                      const y = 140 - (point.income / maxTrendValue) * 95;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                />
                <polyline
                  className="chart-line"
                  fill="none"
                  stroke="#f87171"
                  strokeWidth="3"
                  points={trendData
                    .map((point, index) => {
                      const x = (index / (trendData.length - 1)) * 280 + 20;
                      const y = 140 - (point.expense / maxTrendValue) * 95;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                />
              </svg>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Allocations</p>
                <h3 className="mt-2 text-lg font-semibold text-white">Income envelope totals</h3>
                <div className="mt-4 space-y-3">
                  {effectiveIncomeEnvelopes.length === 0 ? (
                    <p className="text-sm text-slate-500">No income envelopes yet. Add one to start tracking sources.</p>
                  ) : (
                    effectiveIncomeEnvelopes.map((env) => (
                      <div key={env._id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-slate-200">{env.name}</span>
                          <span className="text-sm font-semibold text-emerald-400">{symbol}{formatAmount(env.allocatedAmount)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Summary</p>
                <h3 className="mt-2 text-lg font-semibold text-white">Current snapshot</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                    <span>Allocated income</span>
                    <span className="font-semibold text-emerald-400">{symbol}{formatAmount(totalAllocatedIncome)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                    <span>Actual inflow</span>
                    <span className="font-semibold text-indigo-400">{symbol}{formatAmount(computedTotalIncome)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                    <span>Actual outflow</span>
                    <span className="font-semibold text-rose-400">{symbol}{formatAmount(computedTotalExpense)}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;