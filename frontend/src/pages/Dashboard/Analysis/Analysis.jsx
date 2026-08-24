import React from "react";
import { PERIOD_OPTIONS } from "../../../utils/period";

const Analysis = ({ period, setPeriod }) => {
  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-6 rounded-xl border border-slate-800 gap-4">
        <div>
          <h2 className="text-2xl font-bold">Financial Overview</h2>
          <p className="text-slate-400 text-sm">
            This range applies to all transaction records across the dashboard.
          </p>
        </div>
        <div className="flex flex-wrap bg-slate-950 p-1 rounded-lg border border-slate-800 gap-1">
          {PERIOD_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
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
