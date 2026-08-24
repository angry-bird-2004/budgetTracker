import React, { useState } from "react";
import CreateTransaction from "./CreateEnvelopes/CreateTransaction/CreateTransaction";
import CreateExpenseEnvelope from "./CreateEnvelopes/CreateExpenseEnvelope/CreateExpenseEnvelope";
import CreateIncomeEnvelope from "./CreateEnvelopes/CreateIncomeEnvelope/CreateIncomeEnvelope";
import TransferFund from "./TransferFund/TransferFund";
import Transactions from "./ShowEnvelopes/Transactions/Transactions";
import Incomes from "./ShowEnvelopes/Incomes/Incomes";
import TransactionHistory from "./TransactionHIstory/TransactionHistory";
import { fromBaseAmount, toBaseAmount } from "../../../utils/amounts";

const Maincontent = ({
  handleCreateEnvelope,
  envName,
  setEnvName,
  envAmount,
  setEnvAmount,
  envelopes,
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
  handleImportTransactions,
  loadTransactions,
  txPage,
  txPages,
  txTotal,
  currency,
  conversionRate,
  formatAmount,
  editingTxId,
  handleStartEditTransaction,
  handleCancelEditTransaction,
  transactionFormRef,
  envelopeFormRef,
  transactionSearch,
  setTransactionSearch,
  transactionTypeFilter,
  setTransactionTypeFilter,
  transactionSort,
  setTransactionSort,
  isSubmitting,
  transactionsLoading,
  envelopesLoading,
  incomeEnvelopesLoading,
}) => {
  const [expandedTxId, setExpandedTxId] = useState(null);
  const [selectedEnvelopeId, setSelectedEnvelopeId] = useState(null);
  const [selectedIncomeEnvId, setSelectedIncomeEnvId] = useState(null);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferType, setTransferType] = useState("expense");
  const [fromEnvId, setFromEnvId] = useState("");
  const [toEnvId, setToEnvId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  const symbol = currency === "PKR" ? "Rs " : "$";

  const executeTransfer = async (e) => {
    e.preventDefault();
    if (!fromEnvId || !toEnvId || !transferAmount) return;
    if (fromEnvId === toEnvId) {
      alert("Source and Destination envelopes cannot be the same.");
      return;
    }

    const parsedAmount = parseFloat(transferAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      alert("Enter a valid transfer amount.");
      return;
    }

    const list = transferType === "expense" ? envelopes : incomeEnvelopes;
    const source = list.find((env) => env._id === fromEnvId);
    const remaining = Math.max(
      0,
      source?.currentBalance != null
        ? Number(source.currentBalance)
        : Number(source?.allocatedAmount || 0) - Number(source?.consumed || 0),
    );
    const baseAmount = toBaseAmount(parsedAmount, currency, conversionRate);
    if (baseAmount > remaining) {
      alert("Transfer exceeds remaining funds in the source envelope.");
      return;
    }

    try {
      await handleTransferBetweenEnvelopes(
        transferType,
        fromEnvId,
        toEnvId,
        parsedAmount,
      );
      setShowTransferModal(false);
      setFromEnvId("");
      setToEnvId("");
      setTransferAmount("");
    } catch {
      // Keep the modal open so the user can correct the amount.
    }
  };

  const handleMaxTransfer = () => {
    const list = transferType === "expense" ? envelopes : incomeEnvelopes;
    const source = list.find((env) => env._id === fromEnvId);
    if (!source) return;

    const baseRemaining = Math.max(
      0,
      source.currentBalance != null
        ? Number(source.currentBalance)
        : Number(source.allocatedAmount || 0) - Number(source.consumed || 0),
    );

    const displayedVal = fromBaseAmount(
      baseRemaining,
      currency,
      conversionRate,
    );
    setTransferAmount(displayedVal > 0 ? displayedVal.toFixed(2) : "0");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 w-full max-w-full overflow-x-hidden">
      <div className="space-y-6 lg:col-span-1 w-full min-w-0">
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
          isSubmitting={isSubmitting}
        />

        <CreateExpenseEnvelope
          envelopeFormRef={envelopeFormRef}
          editingEnvId={editingEnvId}
          handleCreateEnvelope={handleCreateEnvelope}
          envName={envName}
          setEnvName={setEnvName}
          envAmount={envAmount}
          setEnvAmount={setEnvAmount}
          symbol={symbol}
          isSubmitting={isSubmitting}
        />

        <CreateIncomeEnvelope
          incomeFormRef={incomeFormRef}
          editingIncomeEnvId={editingIncomeEnvId}
          handleCreateIncomeEnvelope={handleCreateIncomeEnvelope}
          incomeEnvName={incomeEnvName}
          setIncomeEnvName={setIncomeEnvName}
          incomeEnvAmount={incomeEnvAmount}
          setIncomeEnvAmount={setIncomeEnvAmount}
          symbol={symbol}
          isSubmitting={isSubmitting}
        />
      </div>

      <div className="space-y-6 lg:col-span-2 w-full min-w-0">
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
          formatAmount={formatAmount}
          handleMaxTransfer={handleMaxTransfer}
          executeTransfer={executeTransfer}
          isSubmitting={isSubmitting}
        />

        <Transactions
          envelopes={envelopes}
          transactions={transactions}
          selectedEnvelopeId={selectedEnvelopeId}
          setSelectedEnvelopeId={setSelectedEnvelopeId}
          symbol={symbol}
          formatAmount={formatAmount}
          handleUpdateEnvelope={handleUpdateEnvelope}
          handleDeleteEnvelope={handleDeleteEnvelope}
          isSubmitting={isSubmitting}
          envelopesLoading={envelopesLoading}
        />

        <Incomes
          incomeEnvelopes={incomeEnvelopes}
          transactions={transactions}
          selectedIncomeEnvId={selectedIncomeEnvId}
          setSelectedIncomeEnvId={setSelectedIncomeEnvId}
          symbol={symbol}
          formatAmount={formatAmount}
          handleUpdateIncomeEnvelope={handleUpdateIncomeEnvelope}
          handleDeleteIncomeEnvelope={handleDeleteIncomeEnvelope}
          isSubmitting={isSubmitting}
          incomeEnvelopesLoading={incomeEnvelopesLoading}
        />

        <TransactionHistory
          transactions={transactions}
          envelopes={envelopes}
          incomeEnvelopes={incomeEnvelopes}
          expandedTxId={expandedTxId}
          setExpandedTxId={setExpandedTxId}
          symbol={symbol}
          formatAmount={formatAmount}
          handleStartEditTransaction={handleStartEditTransaction}
          handleDeleteTransaction={handleDeleteTransaction}
          handleImportTransactions={handleImportTransactions}
          isSubmitting={isSubmitting}
          transactionSearch={transactionSearch}
          setTransactionSearch={setTransactionSearch}
          transactionTypeFilter={transactionTypeFilter}
          setTransactionTypeFilter={setTransactionTypeFilter}
          transactionSort={transactionSort}
          setTransactionSort={setTransactionSort}
          loadTransactions={loadTransactions}
          txPage={txPage}
          txPages={txPages}
          txTotal={txTotal}
          transactionsLoading={transactionsLoading}
        />
      </div>
    </div>
  );
};

export default Maincontent;
