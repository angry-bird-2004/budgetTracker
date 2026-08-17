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

  // Ref to left column (forms) to scroll into view when editing
  const leftColumnRef = useRef(null);

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
      // Scroll to left column form when editing envelope
      setTimeout(() => {
        leftColumnRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

    // Scroll to left column form so user can update immediately
    setTimeout(() => {
      leftColumnRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-800 gap-4 w-full">
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">
              Expense Dashboard
            </h1>
            <p className="text-xs text-slate-400">
              Manage your budget, envelopes, and taxes seamlessly.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 sm:gap-4">
            <div className="text-left lg:text-right">
              <p className="text-[11px] text-slate-400">Live Rate</p>
              <p className="text-xs font-semibold text-emerald-400">
                {loading
                  ? "Updating rate..."
                  : `1 USD = ${conversionRate.toFixed(2)} PKR`}
              </p>
            </div>

            <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex gap-1">
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`px-3 py-1.5 sm:py-1 rounded text-xs font-semibold transition ${
                  currency === "USD"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                USD ($)
              </button>
              <button
                type="button"
                onClick={() => setCurrency("PKR")}
                className={`px-3 py-1.5 sm:py-1 rounded text-xs font-semibold transition ${
                  currency === "PKR"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                PKR (Rs)
              </button>
            </div>

            {/* Income Sources Dropdown */}
            <div className="flex items-center w-full sm:w-auto justify-between sm:justify-start">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowIncomeDropdown((s) => !s)}
                  className="px-3 py-2 sm:py-1 rounded text-xs font-semibold transition bg-slate-800 text-emerald-400 hover:bg-slate-700 border border-slate-700 w-full sm:w-auto text-center"
                >
                  {incomeSource ? "Change Source" : "Link Income Source"}
                </button>

                {showIncomeDropdown && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-slate-950 border border-slate-800 rounded-lg shadow-2xl z-50 overflow-hidden max-w-[90vw]">
                    <div className="p-2 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800 bg-slate-900/50">
                      Available Income Sources
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {transactions.filter((t) => t.type === "income")
                        .length === 0 ? (
                        <div className="p-4 text-xs text-slate-500 italic">
                          No income sources found
                        </div>
                      ) : (
                        transactions
                          .filter((t) => t.type === "income")
                          .map((inc) => {
                            // Calculate balance: Original Amount - Sum of expenses linked to this ID
                            const spent = transactions
                              .filter(
                                (t) =>
                                  t.incomeSource?._id === inc._id ||
                                  t.incomeSource === inc._id,
                              )
                              .reduce((acc, t) => acc + t.amount, 0);
                            const remaining = inc.amount - spent;

                            return (
                              <button
                                key={inc._id}
                                type="button"
                                onClick={() => {
                                  setIncomeSource(inc._id);
                                  setShowIncomeDropdown(false);
                                }}
                                className="w-full text-left p-3 hover:bg-slate-900 border-b border-slate-900 last:border-0 transition"
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm font-medium text-slate-200">
                                    {inc.title}
                                  </span>
                                  <span className="text-[10px] text-emerald-500 font-bold">
                                    {currency === "PKR" ? "Rs " : "$"}
                                    {formatAmount(remaining)} left
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  Total: {currency === "PKR" ? "Rs " : "$"}
                                  {formatAmount(inc.amount)}
                                </div>
                              </button>
                            );
                          })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Selected income badge */}
              {incomeSource && (
                <div className="ml-2 sm:ml-3 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-900 flex items-center gap-2 shrink-0">
                  <span className="truncate max-w-[100px] sm:max-w-xs">
                    {transactions.find((t) => t._id === incomeSource)?.title ||
                      "Source"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIncomeSource("")}
                    className="hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Header and Period Filter */}
        <Analysis period={period} setPeriod={setPeriod} />

        {/* Analytics Summary */}
        <Header
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          totalTax={totalTax}
          totalDeducted={transactions
            .filter((t) => t.type === "expense" && t.incomeSource)
            .reduce((acc, t) => acc + Number(t.amount || 0), 0)}
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
          leftColumnRef={leftColumnRef}
        />
      </div>
    </div>
  );
};

export default Dashboard;