import React from "react";

const CreateIncomeEnvelope = ({
  incomeFormRef,
  editingIncomeEnvId,
  handleCreateIncomeEnvelope,
  incomeEnvName,
  setIncomeEnvName,
  incomeEnvAmount,
  setIncomeEnvAmount,
  symbol,
}) => {
  return (
    <>
      <div
        ref={incomeFormRef}
        className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold tracking-wide text-slate-200 truncate">
            {editingIncomeEnvId
              ? "Edit Income Envelope"
              : "Create Income Envelope"}
          </h2>
        </div>
        <form onSubmit={handleCreateIncomeEnvelope} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Income Envelope Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Salary, Freelance"
              value={incomeEnvName}
              onChange={(e) => setIncomeEnvName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Initial Income Amount ({symbol})
            </label>
            <input
              type="number"
              step="any"
              required
              placeholder="0.00"
              value={incomeEnvAmount}
              onChange={(e) => setIncomeEnvAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 sm:py-2.5 rounded-lg text-xs sm:text-sm transition shadow-sm"
          >
            {editingIncomeEnvId
              ? "Update Income Envelope"
              : "Add Income Envelope"}
          </button>
        </form>
      </div>
    </>
  );
};

export default CreateIncomeEnvelope;