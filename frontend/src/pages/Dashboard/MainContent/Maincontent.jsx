import React, { useState } from "react";

import CreateTransaction from "./CreateEnvelopes/CreateTransaction/CreateTransaction";
import CreateExpenseEnvelope from "./CreateEnvelopes/CreateExpenseEnvelope/CreateExpenseEnvelope";
import CreateIncomeEnvelope from "./CreateEnvelopes/CreateIncomeEnvelope/CreateIncomeEnvelope";
import TransferFund from "./TransferFund/TransferFund";
import Transactions from "./ShowEnvelopes/Transactions/Transactions";
import Incomes from "./ShowEnvelopes/Incomes/Incomes";
import TransactionHistory from "./TransactionHIstory/TransactionHistory";

const Maincontent = ({
  handleCreateEnvelope,
  envName,
  setEnvName,
  envAmount,
  setEnvAmount,
  envelopes,
  // Income Envelopes Props
  incomeEnvelopes,
  incomeEnvName,
  setIncomeEnvName,
  incomeEnvAmount,
  setIncomeEnvAmount,
  handleCreateIncomeEnvelope,
  handleUpdateIncomeEnvelope,
  handleDeleteIncomeEnvelope,
  editingIncomeEnvId,
  incomeFormRef,
  // Transfer Feature Props
  handleTransferBetweenEnvelopes,
  transactions,
  handleDeleteEnvelope,
  handleUpdateEnvelope,
  editingEnvId,
  handleCreateTransaction,
  txTitle,
  setTxTitle,
  txAmount,
  setTxAmount,
  txType,
  setTxType,
  txEnvelope,
  setTxEnvelope,
  taxApplication,
  setTaxApplication,
  paymentMethod,
  setPaymentMethod,
  incomeSource,
  setIncomeSource,
  // New prop for Income Envelope assignment during transaction creation
  txIncomeEnvelope,
  setTxIncomeEnvelope,
  purpose,
  setPurpose,
  txDate,
  setTxDate,
  taxPercentage,
  setTaxPercentage,
  taxAmount,
  setTaxAmount,
  handleDeleteTransaction,
  currency,
  formatAmount,
  editingTxId,
  handleStartEditTransaction,
  handleCancelEditTransaction,
  transactionFormRef,
  envelopeFormRef,
}) => {
  const [expandedTxId, setExpandedTxId] = useState(null);
  const [selectedEnvelopeId, setSelectedEnvelopeId] = useState(null);
  const [selectedIncomeEnvId, setSelectedIncomeEnvId] = useState(null);

  // Transfer State Controls
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferType, setTransferType] = useState("expense"); // 'expense' or 'income'
  const [fromEnvId, setFromEnvId] = useState("");
  const [toEnvId, setToEnvId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  const symbol = currency === "PKR" ? "Rs " : "$";

  const executeTransfer = (e) => {
    e.preventDefault();
    if (!fromEnvId || !toEnvId || !transferAmount) return;
    if (fromEnvId === toEnvId) {
      alert("Source and Destination envelopes cannot be the same.");
      return;
    }
    handleTransferBetweenEnvelopes(
      transferType,
      fromEnvId,
      toEnvId,
      parseFloat(transferAmount),
    );
    setShowTransferModal(false);
    setFromEnvId("");
    setToEnvId("");
    setTransferAmount("");
  };

  const handleMaxTransfer = () => {
    const list = transferType === "expense" ? envelopes : incomeEnvelopes;
    const source = list.find((env) => env._id === fromEnvId);
    if (!source) return;

    if (transferType === "expense") {
      const consumed = transactions
        .filter(
          (t) =>
            t.type === "expense" &&
            ((t.envelopeId && t.envelopeId._id === source._id) ||
              t.envelopeId === source._id),
        )
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);
      const remaining = (source.allocatedAmount || 0) - consumed;
      setTransferAmount(remaining > 0 ? remaining.toString() : "0");
    } else {
      setTransferAmount((source.allocatedAmount || 0).toString());
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 w-full max-w-full overflow-x-hidden">
      {/* Left Column: Forms (Transaction, Expense Envelope, Income Envelope) */}
      <div className="space-y-6 lg:col-span-1 w-full min-w-0">
        {/* Transaction Form Card */}
        <CreateTransaction
          transactionFormRef={transactionFormRef}
          editingTxId={editingTxId}
          handleCancelEditTransaction={handleCancelEditTransaction}
          handleCreateTransaction={handleCreateTransaction}
          txType={txType}
          setTxType={setTxType}
          txTitle={txTitle}
          setTxTitle={setTxTitle}
          txAmount={txAmount}
          setTxAmount={setTxAmount}
          symbol={symbol}
          txEnvelope={txEnvelope}
          setTxEnvelope={setTxEnvelope}
          envelopes={envelopes}
          txIncomeEnvelope={txIncomeEnvelope}
          setTxIncomeEnvelope={setTxIncomeEnvelope}
          incomeEnvelopes={incomeEnvelopes}
          transactions={transactions}
          formatAmount={formatAmount}
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
        />

        {/* Expense Envelope Manager Form */}
        <CreateExpenseEnvelope
          envelopeFormRef={envelopeFormRef}
          editingEnvId={editingEnvId}
          handleCreateEnvelope={handleCreateEnvelope}
          envName={envName}
          setEnvName={setEnvName}
          envAmount={envAmount}
          setEnvAmount={setEnvAmount}
          symbol={symbol}
        />

        {/* Income Envelope Manager Form */}
        <CreateIncomeEnvelope
          incomeFormRef={incomeFormRef}
          editingIncomeEnvId={editingIncomeEnvId}
          handleCreateIncomeEnvelope={handleCreateIncomeEnvelope}
          incomeEnvName={incomeEnvName}
          setIncomeEnvName={setIncomeEnvName}
          incomeEnvAmount={incomeEnvAmount}
          setIncomeEnvAmount={setIncomeEnvAmount}
          symbol={symbol}
        />
      </div>

      {/* Right Column: Envelopes, Income Envelopes, Transfer Controls & Transactions */}
      <div className="space-y-6 lg:col-span-2 w-full min-w-0">
        {/* Global Transfer Trigger Bar */}
        <TransferFund
          showTransferModal={showTransferModal}
          setShowTransferModal={setShowTransferModal}
          transferType={transferType}
          setTransferType={setTransferType}
          fromEnvId={fromEnvId}
          setFromEnvId={setFromEnvId}
          toEnvId={toEnvId}
          setToEnvId={setToEnvId}
          envelopes={envelopes}
          incomeEnvelopes={incomeEnvelopes}
          transferAmount={transferAmount}
          setTransferAmount={setTransferAmount}
          symbol={symbol}
          handleMaxTransfer={handleMaxTransfer}
          executeTransfer={executeTransfer}
        />

        {/* Budget Envelopes Summary Grid */}
        <Transactions
          envelopes={envelopes}
          transactions={transactions}
          selectedEnvelopeId={selectedEnvelopeId}
          setSelectedEnvelopeId={setSelectedEnvelopeId}
          symbol={symbol}
          formatAmount={formatAmount}
          handleUpdateEnvelope={handleUpdateEnvelope}
          handleDeleteEnvelope={handleDeleteEnvelope}
        />

        {/* Income Envelopes Summary Grid */}
        <Incomes
          incomeEnvelopes={incomeEnvelopes}
          transactions={transactions}
          selectedIncomeEnvId={selectedIncomeEnvId}
          setSelectedIncomeEnvId={setSelectedIncomeEnvId}
          symbol={symbol}
          formatAmount={formatAmount}
          handleUpdateIncomeEnvelope={handleUpdateIncomeEnvelope}
          handleDeleteIncomeEnvelope={handleDeleteIncomeEnvelope}
        />

        {/* Transactions History Feed */}
        <TransactionHistory
          transactions={transactions}
          incomeEnvelopes={incomeEnvelopes}
          expandedTxId={expandedTxId}
          setExpandedTxId={setExpandedTxId}
          symbol={symbol}
          formatAmount={formatAmount}
          handleStartEditTransaction={handleStartEditTransaction}
          handleDeleteTransaction={handleDeleteTransaction}
        />
      </div>
    </div>
  );
};

export default Maincontent;