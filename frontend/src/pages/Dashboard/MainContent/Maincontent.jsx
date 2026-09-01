import React, { useState } from "react";
import CreateTransaction from "./CreateEnvelopes/CreateTransaction/CreateTransaction";
import FillAccounts from "./CreateEnvelopes/FillAccounts/FillAccounts";
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
  handleDeleteTransfer,
  handleUpdateTransfer,
  transactions,
  transfers = [], 
  handleDeleteEnvelope,
  handleUpdateEnvelope,
  editingEnvId,
  handleCreateTransaction,
  handleFillAccount,
  txTitle,
  setTxTitle,
  txAmount,
  setTxAmount,
  txType,
  setTxType,
  editingTxKind,
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
  fillTitle,
  setFillTitle,
  fillAmount,
  setFillAmount,
  fillPaymentMethod,
  setFillPaymentMethod,
  fillPurpose,
  setFillPurpose,
  fillDate,
  setFillDate,
  handleDeleteTransaction,
  handleImportTransactions,
  handleExportTransactions,
  loadTransactions,
  txPage,
  txPages,
  txTotal,
  txLimit,
  period = "all",
  currency,
  conversionRate,
  formatAmount,
  editingTxId,
  handleStartEditTransaction,
  handleCancelEditTransaction,
  transactionFormRef,
  fillAccountsFormRef,
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
  transfersLoading = false,
}) => {
  const [expandedTxId, setExpandedTxId] = useState(null);
  const [selectedEnvelopeId, setSelectedEnvelopeId] = useState(null);
  const [selectedIncomeEnvId, setSelectedIncomeEnvId] = useState(null);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferType, setTransferType] = useState("expense");
  const [fromEnvId, setFromEnvId] = useState("");
  const [toEnvId, setToEnvId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [editingTransferId, setEditingTransferId] = useState(null);

  const symbol = currency === "PKR" ? "Rs " : "$";

  const resetTransferForm = () => {
    setTransferType("expense");
    setFromEnvId("");
    setToEnvId("");
    setTransferAmount("");
    setEditingTransferId(null);
  };

  const handleTransferEdit = (transfer) => {
    const sourceList = transfer.type === "expense" ? envelopes : incomeEnvelopes;
    const fromIdValue = transfer.fromEnvelopeId || transfer.fromId || "";
    const toIdValue = transfer.toEnvelopeId || transfer.toId || "";
    const displayedAmount = fromBaseAmount(
      Number(transfer.amount || 0),
      currency,
      conversionRate,
    );

    setTransferType(transfer.type === "income" ? "income" : "expense");
    setFromEnvId(fromIdValue);
    setToEnvId(toIdValue);
    setTransferAmount(displayedAmount > 0 ? displayedAmount.toFixed(2) : "0");
    setEditingTransferId(transfer._id);
    setShowTransferModal(true);

    if (!sourceList.length) {
      alert("Transfer cannot be edited right now because the envelope list is still loading.");
    }
  };

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
    const destination = list.find((env) => env._id === toEnvId);
    const remaining = Math.max(
      0,
      source?.currentBalance != null
        ? Number(source.currentBalance)
        : Number(source?.allocatedAmount || 0) - Number(source?.consumed || 0),
    );
    const baseAmount = toBaseAmount(parsedAmount, currency, conversionRate);
    if (baseAmount > remaining && !editingTransferId) {
      alert("Transfer exceeds remaining funds in the source envelope.");
      return;
    }

    try {
      if (editingTransferId) {
        await handleUpdateTransfer(editingTransferId, {
          type: transferType,
          fromId: fromEnvId,
          toId: toEnvId,
          amount: parsedAmount,
          purpose: `${source?.name || "Envelope"} → ${destination?.name || "Destination"}`,
        });
      } else {
        await handleTransferBetweenEnvelopes(
          transferType,
          fromEnvId,
          toEnvId,
          parsedAmount,
        );
      }
      setShowTransferModal(false);
      resetTransferForm();
    } catch {
      // Keep modal open on error
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
          editingTxId={editingTxKind === "fill" ? null : editingTxId}
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
          incomeEnvelopes={incomeEnvelopes}
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

        <FillAccounts
          fillAccountsFormRef={fillAccountsFormRef}
          editingTxId={editingTxKind === "fill" ? editingTxId : null}
          handleCancelEditTransaction={handleCancelEditTransaction}
          handleFillAccount={handleFillAccount}
          fillTitle={fillTitle}
          setFillTitle={setFillTitle}
          fillAmount={fillAmount}
          setFillAmount={setFillAmount}
          symbol={symbol}
          formatAmount={formatAmount}
          incomeEnvelopes={incomeEnvelopes}
          txIncomeEnvelope={txIncomeEnvelope}
          setTxIncomeEnvelope={setTxIncomeEnvelope}
          fillPaymentMethod={fillPaymentMethod}
          setFillPaymentMethod={setFillPaymentMethod}
          fillPurpose={fillPurpose}
          setFillPurpose={setFillPurpose}
          fillDate={fillDate}
          setFillDate={setFillDate}
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
          closeTransferModal={() => {
            setShowTransferModal(false);
            resetTransferForm();
          }}
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
          selectedEnvelopeId={selectedEnvelopeId}
          setSelectedEnvelopeId={setSelectedEnvelopeId}
          symbol={symbol}
          formatAmount={formatAmount}
          handleUpdateEnvelope={handleUpdateEnvelope}
          handleDeleteEnvelope={handleDeleteEnvelope}
          isSubmitting={isSubmitting}
          envelopesLoading={envelopesLoading}
          period={period}
        />

        <Incomes
          incomeEnvelopes={incomeEnvelopes}
          selectedIncomeEnvId={selectedIncomeEnvId}
          setSelectedIncomeEnvId={setSelectedIncomeEnvId}
          symbol={symbol}
          formatAmount={formatAmount}
          handleUpdateIncomeEnvelope={handleUpdateIncomeEnvelope}
          handleDeleteIncomeEnvelope={handleDeleteIncomeEnvelope}
          isSubmitting={isSubmitting}
          incomeEnvelopesLoading={incomeEnvelopesLoading}
          period={period}
        />

        <TransactionHistory
          transactions={transactions}
          transfers={transfers}
          envelopes={envelopes}
          incomeEnvelopes={incomeEnvelopes}
          expandedTxId={expandedTxId}
          setExpandedTxId={setExpandedTxId}
          symbol={symbol}
          formatAmount={formatAmount}
          handleStartEditTransaction={handleStartEditTransaction}
          handleDeleteTransaction={handleDeleteTransaction}
          handleDeleteTransfer={handleDeleteTransfer}
          handleStartEditTransfer={handleTransferEdit}
          handleImportTransactions={handleImportTransactions}
          handleExportTransactions={handleExportTransactions}
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
          txLimit={txLimit}
          transactionsLoading={transactionsLoading}
          transfersLoading={transfersLoading}
          period={period}
        />
      </div>
    </div>
  );
};

export default Maincontent;