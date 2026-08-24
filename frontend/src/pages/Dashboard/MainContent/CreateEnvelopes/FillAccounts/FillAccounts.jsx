import React from "react";
import Title from "../CreateTransaction/Form/Common/Title";
import Amount from "../CreateTransaction/Form/Common/Amount";
import PaymentMethode from "../CreateTransaction/Form/Common/PaymentMethode";
import Purpose from "../CreateTransaction/Form/Common/Purpose";
import DateTime from "../CreateTransaction/Form/Common/DateTime";
import SubmitBtn from "../CreateTransaction/Form/Common/SubmitBtn";
import IncomeOption from "../CreateTransaction/Form/Common/IncomeOption";

const FillAccounts = ({
  fillAccountsFormRef,
  editingTxId,
  handleCancelEditTransaction,
  handleFillAccount,
  fillTitle,
  setFillTitle,
  fillAmount,
  setFillAmount,
  symbol,
  formatAmount,
  incomeEnvelopes,
  txIncomeEnvelope,
  setTxIncomeEnvelope,
  fillPaymentMethod,
  setFillPaymentMethod,
  fillPurpose,
  setFillPurpose,
  fillDate,
  setFillDate,
  isSubmitting,
}) => {
  return (
    <div
      ref={fillAccountsFormRef}
      className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm w-full"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold tracking-wide text-slate-200 truncate">
          {editingTxId ? "Edit Fill accounts" : "Fill accounts"}
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
      <form onSubmit={handleFillAccount} className="space-y-4">
        <Title
          txTitle={fillTitle}
          setTxTitle={setFillTitle}
          placeholder="e.g. Salary, Bonus"
        />
        <Amount
          txAmount={fillAmount}
          setTxAmount={setFillAmount}
          symbol={symbol}
        />
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
              symbol={symbol}
              formatAmount={formatAmount}
            />
          </select>
        </div>
        <PaymentMethode
          paymentMethod={fillPaymentMethod}
          setPaymentMethod={setFillPaymentMethod}
        />
        <Purpose purpose={fillPurpose} setPurpose={setFillPurpose} />
        <DateTime txDate={fillDate} setTxDate={setFillDate} />
        <SubmitBtn
          isSubmitting={isSubmitting}
          editingTxId={editingTxId}
          addLabel="Fill Account"
          updateLabel="Update Fill"
          addingLabel="Filling Account..."
          updatingLabel="Updating Fill..."
        />
      </form>
    </div>
  );
};

export default FillAccounts;
