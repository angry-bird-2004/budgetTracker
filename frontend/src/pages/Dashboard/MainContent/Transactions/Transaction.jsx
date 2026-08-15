import React, { useState, useRef } from "react";
import TransactionForm from "./TransactionForm/TransactionForm";
import TansactionHistory from "./TansactionHistory/TansactionHistory";

const Transaction = ({
  handleCreateTransaction,
  handleUpdateTransaction,
  txTitle,
  setTxTitle,
  txAmount,
  setTxAmount,
  txType,
  setTxType,
  txEnvelope,
  setTxEnvelope,
  paymentMethod,
  setPaymentMethod,
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
  envelopes,
  transactions,
  handleDeleteTransaction,
  currency = "USD",
  formatAmount,
  editingTxId,
  handleStartEditTransaction,
  handleCancelEditTransaction,
  conversionRate = 277.42,
}) => {
  const symbol = currency === "PKR" ? "Rs " : "$";

  // Ref to target the form section for auto-scrolling
  const formRef = useRef(null);

  // State to track which transaction's details are expanded
  const [expandedTxId, setExpandedTxId] = useState(null);
  
  // State to track which envelope dropdown is open
  const [openDropdown, setOpenDropdown] = useState("income");

  // States for inline amount modification and audit logging
  const [editAmount, setEditAmount] = useState("");
  const [editReason, setEditReason] = useState("");

  // State for advanced tax configuration mode during creation/editing
  const [taxMode, setTaxMode] = useState("percentage");

  const toggleExpand = (id) => {
    setExpandedTxId(expandedTxId === id ? null : id);
    if (expandedTxId !== id && handleCancelEditTransaction) {
      handleCancelEditTransaction();
    }
  };

  const toggleDropdown = (key) => {
    setOpenDropdown(openDropdown === key ? null : key);
  };

  const startEditing = (tx, e) => {
    e.stopPropagation();
    if (handleStartEditTransaction) {
      handleStartEditTransaction(tx);
    }
    // Smoothly scroll up to the transaction form
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const cancelEditing = (e) => {
    if (e) e.stopPropagation();
    if (handleCancelEditTransaction) {
      handleCancelEditTransaction();
    }
    setEditAmount("");
    setEditReason("");
  };

  const submitEdit = (tx, e) => {
    e.stopPropagation();
    const parsedAmount = parseFloat(editAmount);
    if (editAmount === "" || isNaN(parsedAmount) || !editReason || !String(editReason).trim()) {
      alert("Please enter a valid new amount and a reason for the change.");
      return;
    }

    const inputAmountNum = parseFloat(editAmount);
    const newAmountNum = currency === "PKR" ? inputAmountNum / conversionRate : inputAmountNum;
    
    const oldAmount = parseFloat(tx.amount);
    const diff = newAmountNum - oldAmount;

    const newLogEntry = {
      before: oldAmount,
      after: newAmountNum,
      diff: diff,
      reason: editReason,
      timestamp: new Date(),
    };

    const updatedLogs = tx.updateLogs ? [...tx.updateLogs, newLogEntry] : [newLogEntry];

    const updateData = {
      amount: newAmountNum,
      updateLogs: updatedLogs,
    };

    if (handleUpdateTransaction) {
      handleUpdateTransaction(tx._id, updateData);
    }

    if (handleCancelEditTransaction) {
      handleCancelEditTransaction();
    }
    setEditAmount("");
    setEditReason("");
  };

  // Filter transactions
  const incomeTransactions = transactions.filter((tx) => tx.type === "income");
  const expenseTransactions = transactions.filter((tx) => tx.type === "expense");

  // Separate general expenses from envelope-specific expenses
  const generalExpenses = expenseTransactions.filter(
    (tx) => !tx.envelopeId && !tx.envelope
  );

  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-6">
      {/* Target ref wrapper for smooth scrolling */}
      <div ref={formRef}>
        <TransactionForm
          editingTxId={editingTxId}
          handleCancelEditTransaction={cancelEditing}
          handleCreateTransaction={handleCreateTransaction}
          txTitle={txTitle}
          setTxTitle={setTxTitle}
          txAmount={txAmount}
          setTxAmount={setTxAmount}
          symbol={symbol}
          txType={txType}
          setTxType={setTxType}
          txEnvelope={txEnvelope}
          setTxEnvelope={setTxEnvelope}
          envelopes={envelopes}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          purpose={purpose}
          setPurpose={setPurpose}
          taxMode={taxMode}
          setTaxMode={setTaxMode}
          taxApplication={taxApplication}
          setTaxApplication={setTaxApplication}
          taxPercentage={taxPercentage}
          setTaxPercentage={setTaxPercentage}
          taxAmount={taxAmount}
          setTaxAmount={setTaxAmount}
          txDate={txDate}
          setTxDate={setTxDate}
        />
      </div>
      
      <TansactionHistory
        symbol={symbol}
        incomeTransactions={incomeTransactions}
        expenseTransactions={expenseTransactions}
        generalExpenses={generalExpenses}
        envelopes={envelopes}
        openDropdown={openDropdown}
        toggleDropdown={toggleDropdown}
        expandedTxId={expandedTxId}
        toggleExpand={toggleExpand}
        handleDeleteTransaction={handleDeleteTransaction}
        formatAmount={formatAmount}
        editingTxId={editingTxId}
        startEditing={startEditing}
        cancelEditing={cancelEditing}
        submitEdit={submitEdit}
        editAmount={editAmount}
        setEditAmount={setEditAmount}
        editReason={editReason}
        setEditReason={setEditReason}
      />
    </div>
  );
};

export default Transaction;