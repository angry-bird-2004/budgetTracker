import React from "react";
import Title from "./Common/Title";
import Amount from "./Common/Amount";
import Type from "./Common/Type";
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
  formatAmount,
  isSubmitting,
  editingTxId,
  handleCreateTransaction,
}) => {
  const isExpense = txType === "expense";

  return (
    <form onSubmit={handleCreateTransaction} className="space-y-4">
      <Type txType={txType} setTxType={setTxType} />
      <Title txTitle={txTitle} setTxTitle={setTxTitle} />
      <Amount txAmount={txAmount} setTxAmount={setTxAmount} symbol={symbol} />

      <ExpenseEnvelope
        txEnvelope={txEnvelope}
        setTxEnvelope={setTxEnvelope}
        envelopes={envelopes}
      />

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">
          {isExpense
            ? "Pay From Income Envelope"
            : "Credit To Income Envelope"}
        </label>
        <select
          required
          value={incomeSource || ""}
          onChange={(e) => setIncomeSource(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 truncate"
        >
          <option value="">
            {Array.isArray(incomeEnvelopes) && incomeEnvelopes.length
              ? "Select Income Envelope Source"
              : "No income envelopes yet"}
          </option>
          <IncomeOption
            incomeEnvelopes={incomeEnvelopes}
            symbol={symbol}
            formatAmount={formatAmount}
          />
        </select>
        {(!Array.isArray(incomeEnvelopes) || incomeEnvelopes.length === 0) && (
          <p className="mt-1 text-[11px] text-slate-500">
            Create an income envelope first — it will show up here for new
            transactions.
          </p>
        )}
      </div>

      <PaymentMethode
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
      />

      <Purpose purpose={purpose} setPurpose={setPurpose} />
      <DateTime txDate={txDate} setTxDate={setTxDate} />

      {isExpense && (
        <Tax
          taxPercentage={taxPercentage}
          setTaxPercentage={setTaxPercentage}
          taxAmount={taxAmount}
          setTaxAmount={setTaxAmount}
          taxApplication={taxApplication}
          setTaxApplication={setTaxApplication}
          symbol={symbol}
        />
      )}

      <SubmitBtn isSubmitting={isSubmitting} editingTxId={editingTxId} />
    </form>
  );
};

export default Form;
