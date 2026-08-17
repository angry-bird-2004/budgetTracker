import React from "react";

const Analysis = ({ period, setPeriod }) => {
  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-6 rounded-xl border border-slate-800 gap-4">
        <div>
          <h2 className="text-2xl font-bold">Financial Overview</h2>
          <p className="text-slate-400 text-sm">
            Manage envelopes and view spending history across intervals.
          </p>
        </div>
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          {["weekly", "monthly", "yearly"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-md text-sm capitalize font-medium transition ${period === p ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Analysis;
