import React from "react";

const Analysis = ({ period, setPeriod }) => {
  const periods = [
    { key: "all", label: "All Time" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
    { key: "financial-year", label: "Financial Year (Jul-Jun)" },
    { key: "yearly", label: "Yearly" },
  ];

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-6 rounded-xl border border-slate-800 gap-4">
        <div>
          <h2 className="text-2xl font-bold">Financial Overview</h2>
          <p className="text-slate-400 text-sm">
            Manage envelopes and view spending history across intervals.
          </p>
        </div>
        <div className="flex flex-wrap bg-slate-950 p-1 rounded-lg border border-slate-800 gap-1">
          {periods.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition ${
                period === key
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Analysis;