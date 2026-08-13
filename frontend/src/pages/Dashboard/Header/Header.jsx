import React from "react";

const Header = ({ totalIncome, totalExpense }) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <p className="text-slate-400 text-sm font-medium">Total Income</p>
          <h3 className="text-3xl font-bold text-emerald-400 mt-2">
            ${totalIncome.toFixed(2)}
          </h3>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <p className="text-slate-400 text-sm font-medium">Total Expenses</p>
          <h3 className="text-3xl font-bold text-rose-400 mt-2">
            ${totalExpense.toFixed(2)}
          </h3>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <p className="text-slate-400 text-sm font-medium">Net Savings</p>
          <h3
            className={`text-3xl font-bold mt-2 ${totalIncome - totalExpense >= 0 ? "text-indigo-400" : "text-rose-500"}`}
          >
            ${(totalIncome - totalExpense).toFixed(2)}
          </h3>
        </div>
      </div>
    </>
  );
};

export default Header;
