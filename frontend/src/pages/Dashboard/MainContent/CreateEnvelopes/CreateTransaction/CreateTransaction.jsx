import React from "react";
import Form from "./Form/Form";

const CreateTransaction = ({
  transactionFormRef,
  editingTxId,
  handleCancelEditTransaction,
  handleCreateTransaction,
  txType,
  setTxType,
  txTitle,
  setTxTitle,
  txAmount,
  setTxAmount,
  symbol,
  formatAmount,
  envelopes,
  txEnvelope,
  setTxEnvelope,
  incomeEnvelopes,
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
  isSubmitting,
}) => {
  return (
    <div
      ref={transactionFormRef}
      className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm w-full"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold tracking-wide text-slate-200 truncate">
          {editingTxId ? "Edit Transaction" : "New Transaction"}
        </h2>
        {editingTxId && (
          <button
            type="button"
            onClick={handleCancelEditTransaction}
            className="text-xs text-rose-400 hover:text-rose-300 font-medium shrink-0 ml-2"
          >
            Cancel Edit
          </button>
        )}
      </div>
      <Form
        txType={txType}
        setTxType={setTxType}
        txTitle={txTitle}
        setTxTitle={setTxTitle}
        txAmount={txAmount}
        setTxAmount={setTxAmount}
        txEnvelope={txEnvelope}
        setTxEnvelope={setTxEnvelope}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        incomeSource={incomeSource}
        setIncomeSource={setIncomeSource}
        purpose={purpose}
        setPurpose={setPurpose}
        txDate={txDate}
        setTxDate={setTxDate}
        taxPercentage={taxPercentage}
        setTaxPercentage={setTaxPercentage}
        taxAmount={taxAmount}
        setTaxAmount={setTaxAmount}
        taxApplication={taxApplication}
        setTaxApplication={setTaxApplication}
        symbol={symbol}
        envelopes={envelopes}
        incomeEnvelopes={incomeEnvelopes}
        formatAmount={formatAmount}
        isSubmitting={isSubmitting}
        editingTxId={editingTxId}
        handleCreateTransaction={handleCreateTransaction}
      />
    </div>
  );
};

export default CreateTransaction;
