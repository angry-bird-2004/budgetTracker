import React, { useState, useEffect, useRef } from "react";
import {
  fetchEnvelopes,
  addEnvelope,
  updateEnvelope,
  removeEnvelope,
  fetchTransactions,
  addTransaction,
  removeTransaction,
  updateTransaction,
} from "../../services/api";
import Currency from "./Currency/Currency";
import Analysis from "./Analysis/Analysis";
import Header from "./Header/Header";
import Maincontent from "./MainContent/Maincontent";
import { useExchangeRate } from "../../Hooks/useExchangeRate";

const Dashboard = () => {
  const [envelopes, setEnvelopes] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [period, setPeriod] = useState("monthly");

  // Currency State ('USD' or 'PKR')
  const [currency, setCurrency] = useState("USD");
  const { conversionRate, loading } = useExchangeRate();

  // Helper utility to format and convert amounts anywhere in dashboard
  const formatAmount = (val) => {
    const num = Number(val) || 0;
    const converted = currency === "PKR" ? num * conversionRate : num;
    return converted.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Form states for Envelopes
  const [envName, setEnvName] = useState("");
  const [envAmount, setEnvAmount] = useState("");
  const [editingEnvId, setEditingEnvId] = useState(null);

  // Form states for Transactions
  const [txTitle, setTxTitle] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txType, setTxType] = useState("expense");
  const [txEnvelope, setTxEnvelope] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [incomeSource, setIncomeSource] = useState("");
  const [purpose, setPurpose] = useState("");
  const [txDate, setTxDate] = useState("");
  const [taxPercentage, setTaxPercentage] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [taxApplication, setTaxApplication] = useState("exclusive");

  // State for tracking transaction being edited
  const [editingTxId, setEditingTxId] = useState(null);
  // Dropdown visibility for income sources selector
  const [showIncomeDropdown, setShowIncomeDropdown] = useState(false);

  // Refs to specific forms so we can scroll to the appropriate form
  const transactionFormRef = useRef(null);
  const envelopeFormRef = useRef(null);

  const loadData = async () => {
    try {
      const envRes = await fetchEnvelopes();
      setEnvelopes(envRes.data);
      const txRes = await fetchTransactions(period);
      setTransactions(txRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  const handleCreateEnvelope = async (e) => {
    e.preventDefault();
    if (!envName || !envAmount) return;

    const baseAmountInput =
      currency === "PKR"
        ? Number(envAmount) / conversionRate
        : Number(envAmount);

    if (editingEnvId) {
      await updateEnvelope(editingEnvId, {
        name: envName,
        allocatedAmount: baseAmountInput,
      });
      setEditingEnvId(null);
    } else {
      await addEnvelope({ name: envName, allocatedAmount: baseAmountInput });
    }

    setEnvName("");
    setEnvAmount("");
    loadData();
  };

  const handleUpdateEnvelope = (id) => {
    const envelopeToEdit = envelopes.find((env) => env._id === id);
    if (envelopeToEdit) {
      setEditingEnvId(envelopeToEdit._id);
      setEnvName(envelopeToEdit.name);
      const displayedVal =
        currency === "PKR"
          ? envelopeToEdit.allocatedAmount * conversionRate
          : envelopeToEdit.allocatedAmount;
      setEnvAmount(displayedVal.toFixed(2));
      // Scroll to envelope form when editing envelope
      setTimeout(() => {
        envelopeFormRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 60);
    }
  };

  const handleDeleteEnvelope = async (id) => {
    await removeEnvelope(id);
    if (editingEnvId === id) {
      setEditingEnvId(null);
      setEnvName("");
      setEnvAmount("");
    }
    loadData();
  };

  // Populate transaction fields into form for editing
  const handleStartEditTransaction = (tx) => {
    setEditingTxId(tx._id);
    setTxTitle(tx.title || "");

    // Display amount based on current currency view
    const displayedAmount =
      currency === "PKR" ? tx.amount * conversionRate : tx.amount;
    setTxAmount(displayedAmount.toFixed(2));

    setTxType(tx.type || "expense");
    setTxEnvelope(tx.envelopeId?._id || tx.envelopeId || "");
    setPaymentMethod(
      tx.paymentMethod ? tx.paymentMethod.toLowerCase() : "cash",
    );
    setIncomeSource(tx.incomeSource?._id || tx.incomeSource || "");
    setPurpose(tx.purpose || "");

    // Format date for standard <input type="date" /> (YYYY-MM-DD)
    if (tx.date) {
      const formattedDate = new Date(tx.date).toISOString().split("T")[0];
      setTxDate(formattedDate);
    } else {
      setTxDate("");
    }

    setTaxPercentage(tx.taxPercentage ?? "");

    const displayedTax =
      currency === "PKR" && tx.taxAmount
        ? tx.taxAmount * conversionRate
        : tx.taxAmount || "";
    setTaxAmount(displayedTax ?? "");
    setTaxApplication(tx.taxApplication || "exclusive");

    // Scroll to transaction form so user can update immediately
    setTimeout(() => {
      transactionFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 60);
  };

  // Reset/Cancel transaction edit mode (Preserves incomeSource selection)
  const handleCancelEditTransaction = () => {
    setEditingTxId(null);
    setTxTitle("");
    setTxAmount("");
    setPurpose("");
    setTaxPercentage("");
    setTaxAmount("");
    setTaxApplication("exclusive");
    setPaymentMethod("cash");
    setTxDate("");
    setTxEnvelope("");
    // Note: incomeSource is intentionally omitted here so your persistent selection remains intact
  };

  // Unified handler to create a new transaction OR update an existing one with update logging
  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    try {
      let rawInputAmount = parseFloat(txAmount);
      let rawAmount =
        currency === "PKR" ? rawInputAmount / conversionRate : rawInputAmount;

      let calculatedTaxAmount = taxAmount ? parseFloat(taxAmount) : 0;
      if (currency === "PKR" && taxAmount)
        calculatedTaxAmount /= conversionRate;

      let calculatedTaxPercentage = taxPercentage
        ? parseFloat(taxPercentage)
        : 0;
      let finalAmount = rawAmount;

      if (calculatedTaxPercentage > 0 && !taxAmount) {
        calculatedTaxAmount = (rawAmount * calculatedTaxPercentage) / 100;
      }

      if (
        txType === "expense" &&
        (calculatedTaxAmount > 0 || calculatedTaxPercentage > 0)
      ) {
        if (taxApplication === "exclusive") {
          finalAmount = rawAmount + calculatedTaxAmount;
        } else if (taxApplication === "inclusive") {
          finalAmount = rawAmount;
        }
      }

      let updateLogs = [];
      if (editingTxId) {
        const existingTx = transactions.find((tx) => tx._id === editingTxId);
        if (existingTx) {
          const oldAmountNum = Number(existingTx.amount) || 0;
          const diffAmount = finalAmount - oldAmountNum;

          const sanitizedExistingLogs = (existingTx.updateLogs || []).map(
            (log) => ({
              before: Number(
                log.before ?? log.changes?.amount?.before ?? oldAmountNum,
              ),
              after: Number(
                log.after ?? log.changes?.amount?.after ?? oldAmountNum,
              ),
              diff: Number(log.diff ?? log.changes?.amount?.diff ?? 0),
              reason: log.reason || "Updated",
              timestamp: log.timestamp || new Date(),
            }),
          );

          const titleChanged = (existingTx.title || "") !== (txTitle || "");
          const amountChanged = Math.abs(oldAmountNum - finalAmount) > 0.001;
          const purposeChanged = (existingTx.purpose || "") !== (purpose || "");
          const paymentChanged =
            (existingTx.paymentMethod || "cash").toLowerCase() !==
            (paymentMethod || "cash").toLowerCase();
          const incomeSourceChanged =
            String(
              existingTx.incomeSource?._id || existingTx.incomeSource || "",
            ) !== String(incomeSource || "");

          if (
            titleChanged ||
            amountChanged ||
            purposeChanged ||
            paymentChanged ||
            incomeSourceChanged
          ) {
            const newLogEntry = {
              before: oldAmountNum,
              after: finalAmount,
              diff: diffAmount,
              reason: purpose || "Updated via main form",
              timestamp: new Date(),
            };
            updateLogs = [...sanitizedExistingLogs, newLogEntry];
          } else {
            updateLogs = sanitizedExistingLogs;
          }
        }
      }

      const transactionData = {
        title: txTitle,
        amount: finalAmount,
        type: txType,
        envelopeId: txType === "expense" && txEnvelope ? txEnvelope : undefined,
        paymentMethod: paymentMethod,
        incomeSource:
          txType === "expense" && incomeSource ? incomeSource : undefined,
        purpose: purpose || undefined,
        taxPercentage: calculatedTaxPercentage || undefined,
        taxAmount: calculatedTaxAmount || undefined,
        taxApplication: taxApplication,
        date: txDate ? new Date(txDate) : new Date(),
        updateLogs: editingTxId ? updateLogs : undefined,
      };

      if (editingTxId) {
        const res = await updateTransaction(editingTxId, transactionData);
        setTransactions((prev) =>
          prev.map((tx) => (tx._id === editingTxId ? res.data : tx)),
        );
        setEditingTxId(null);
      } else {
        // If user selected an income source to deduct from, validate remaining funds (do not mutate original income)
        if (
          transactionData.type === "expense" &&
          transactionData.incomeSource
        ) {
          const incomeId = transactionData.incomeSource;
          const incomeTx = transactions.find((t) => t._id === incomeId) || null;
          const spent = transactions
            .filter(
              (t) =>
                t.type === "expense" &&
                (t.incomeSource?._id === incomeId ||
                  t.incomeSource === incomeId),
            )
            .reduce((acc, t) => acc + Number(t.amount || 0), 0);
          const incomeAmount = incomeTx ? Number(incomeTx.amount || 0) : 0;
          const remaining = incomeAmount - spent;
          if (remaining < finalAmount) {
            alert(
              "Selected income source does not have sufficient remaining funds to cover this expense.",
            );
            return;
          }
        }

        const response = await addTransaction(transactionData);
        setTransactions([response.data, ...transactions]);
      }

      handleCancelEditTransaction();
      loadData();
    } catch (error) {
      console.error("Error saving transaction:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message;
      alert("Failed to save transaction: " + errorMsg);
    }
  };

  const handleUpdateTransaction = async (id, updateData) => {
    try {
      const res = await updateTransaction(id, updateData);
      setTransactions((prev) =>
        prev.map((tx) => (tx._id === id ? res.data : tx)),
      );
    } catch (error) {
      console.error("Failed to update transaction:", error);
    }
  };

  const handleDeleteTransaction = async (id) => {
    await removeTransaction(id);
    if (editingTxId === id) {
      handleCancelEditTransaction();
    }
    loadData();
  };

  // Calculations
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalTax = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => {
      let taxVal = 0;
      if (t.taxAmount) {
        taxVal = Number(t.taxAmount);
      } else if (t.taxPercentage && t.amount) {
        taxVal = (t.amount * Number(t.taxPercentage)) / 100;
      }
      return acc + taxVal;
    }, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 w-full max-w-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 w-full">
        {/* Top Control Bar with Currency Switcher & Live Rate Indicator */}
        <Currency
          loading={loading}
          conversionRate={conversionRate}
          currency={currency}
          setCurrency={setCurrency}
          incomeSource={incomeSource}
          setIncomeSource={setIncomeSource}
          showIncomeDropdown={showIncomeDropdown}
          setShowIncomeDropdown={setShowIncomeDropdown}
          transactions={transactions}
          formatAmount={formatAmount}
        />

        {/* Header and Period Filter */}
        <Analysis period={period} setPeriod={setPeriod} />

        {/* Analytics Summary */}
        <Header
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          totalTax={totalTax}
          currency={currency}
          formatAmount={formatAmount}
        />

        {/* Main Content Component */}
        <Maincontent
          handleUpdateTransaction={handleUpdateTransaction}
          handleCreateEnvelope={handleCreateEnvelope}
          envName={envName}
          setEnvName={setEnvName}
          envAmount={envAmount}
          setEnvAmount={setEnvAmount}
          envelopes={envelopes}
          transactions={transactions}
          handleDeleteEnvelope={handleDeleteEnvelope}
          handleUpdateEnvelope={handleUpdateEnvelope}
          editingEnvId={editingEnvId}
          setEditingEnvId={setEditingEnvId}
          handleCreateTransaction={handleCreateTransaction}
          txTitle={txTitle}
          setTxTitle={setTxTitle}
          txAmount={txAmount}
          setTxAmount={setTxAmount}
          txType={txType}
          setTxType={setTxType}
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
          handleDeleteTransaction={handleDeleteTransaction}
          currency={currency}
          conversionRate={conversionRate}
          formatAmount={formatAmount}
          editingTxId={editingTxId}
          handleStartEditTransaction={handleStartEditTransaction}
          handleCancelEditTransaction={handleCancelEditTransaction}
          transactionFormRef={transactionFormRef}
          envelopeFormRef={envelopeFormRef}
        />
      </div>
    </div>
  );
};

export default Dashboard;
