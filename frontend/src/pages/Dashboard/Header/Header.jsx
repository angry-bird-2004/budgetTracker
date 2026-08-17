import React from "react";

const Header = ({
  totalIncome,
  totalExpense,
  totalTax = 0,
  currency = "USD",
  formatAmount,
}) => {
  const symbol = currency === "PKR" ? "Rs " : "$";
  const netSavings = totalIncome - totalExpense;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <p className="text-slate-400 text-sm font-medium">Total Income</p>
          <h3 className="text-3xl font-bold text-emerald-400 mt-2">
            {symbol}
            {formatAmount(totalIncome)}
          </h3>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <p className="text-slate-400 text-sm font-medium">Total Expenses</p>
          <h3 className="text-3xl font-bold text-rose-400 mt-2">
            {symbol}
            {formatAmount(totalExpense)}
          </h3>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <p className="text-slate-400 text-sm font-medium">Total Tax Paid</p>
          <h3 className="text-3xl font-bold text-amber-400 mt-2">
            {symbol}
            {formatAmount(totalTax)}
          </h3>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <p className="text-slate-400 text-sm font-medium">Net Savings</p>
          <h3
            className={`text-3xl font-bold mt-2 ${netSavings >= 0 ? "text-indigo-400" : "text-rose-500"}`}
          >
            {symbol}
            {formatAmount(netSavings)}
          </h3>
        </div>
      </div>
    </>
  );
};

export default Header;
