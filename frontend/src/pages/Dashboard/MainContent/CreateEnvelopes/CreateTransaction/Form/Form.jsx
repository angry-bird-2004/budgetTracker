import React from "react";
import Title from "./Common/Title";
import Amount from "./Common/Amount";
import ExpenseEnvelope from "./Expense/ExpenseEnvelope";
import PaymentMethode from "./Common/PaymentMethode";
import Purpose from "./Common/Purpose";
import DateTime from "./Common/DateTime";
import Tax from "./Expense/Tax";
import SubmitBtn from "./Common/SubmitBtn";
import IncomeOption from "./Common/IncomeOption";
const Form = ({
  txType,
  setTxType,
  txTitle,
  setTxTitle,
  txAmount,
  setTxAmount,
  txEnvelope,
  setTxEnvelope,
  txIncomeEnvelope,
  setTxIncomeEnvelope,
  paymentMethod,
  setPaymentMethod,
  incomeSource,
  setIncomeSource,
  purpose,
  setPurpose,
  txDate,
  setTxDate,
  taxPercentage,
  setTaxPercentage,
  taxAmount,
  setTaxAmount,
  taxApplication,
  setTaxApplication,
  symbol,
  envelopes,
  incomeEnvelopes,
  transactions,
  formatAmount,
  isSubmitting,
  editingTxId,
  handleCreateTransaction,
}) => {
  return (
    <form onSubmit={handleCreateTransaction} className="space-y-4">
      {/* togggle button  */}
      <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
        <button
          type="button"
          onClick={() => setTxType("expense")}
          className={`py-2 sm:py-1.5 text-xs font-medium rounded transition ${
            txType === "expense"
              ? "bg-rose-600/20 text-rose-400 border border-rose-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => setTxType("income")}
          className={`py-2 sm:py-1.5 text-xs font-medium rounded transition ${
            txType === "income"
              ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Income
        </button>
      </div>
      {/* title */}
      <Title txTitle={txTitle} setTxTitle={setTxTitle} />
      {/* amount  */}
      <Amount txAmount={txAmount} setTxAmount={setTxAmount} symbol={symbol} />

      {/* Expense Envelope Selector */}
      <ExpenseEnvelope
        txType={txType}
        txEnvelope={txEnvelope}
        setTxEnvelope={setTxEnvelope}
        envelopes={envelopes}
      />

      {/* Income Envelope Selector (Appears when txType is 'income') */}
      {txType === "income" && (
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Income Envelope
          </label>
          <select
            required
            value={txIncomeEnvelope || ""}
            onChange={(e) => setTxIncomeEnvelope(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 truncate"
          >
            <option value="">Select Income Envelope Target</option>
            <IncomeOption
              incomeEnvelopes={incomeEnvelopes}
              transactions={transactions}
              symbol={symbol}
              formatAmount={formatAmount}
            />
          </select>
        </div>
      )}
      {txType === "expense" && (
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Pay From Income Envelope
          </label>
          <select
            required
            value={incomeSource}
            onChange={(e) => setIncomeSource(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 truncate"
          >
            <option value="">Select Income Envelope Source</option>
            <IncomeOption
              incomeEnvelopes={incomeEnvelopes}
              transactions={transactions}
              symbol={symbol}
              formatAmount={formatAmount}
            />
          </select>
        </div>
      )}
      {/* paymentMethod */}
      <PaymentMethode
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
      />

      {/* purpose/notes */}
      <Purpose purpose={purpose} setPurpose={setPurpose} />
      {/* date */}
      <DateTime txDate={txDate} setTxDate={setTxDate} />

      <Tax
        txType={txType}
        taxPercentage={taxPercentage}
        setTaxPercentage={setTaxPercentage}
        taxAmount={taxAmount}
        setTaxAmount={setTaxAmount}
        taxApplication={taxApplication}
        setTaxApplication={setTaxApplication}
        symbol={symbol}
      />
      {/* submit */}
      <SubmitBtn isSubmitting={isSubmitting} editingTxId={editingTxId} />
    </form>
  );
};

export default Form;
