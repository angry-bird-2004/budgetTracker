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
  fetchIncomeEnvelopes,
  addIncomeEnvelope,
  updateIncomeEnvelope,
  removeIncomeEnvelope,
} from "../../services/api";
import Navbar from "../../components/Navbar";
import Currency from "./Currency/Currency";
import Analysis from "./Analysis/Analysis";
import Header from "./Header/Header";
import Maincontent from "./MainContent/Maincontent";
import { useExchangeRate } from "../../Hooks/useExchangeRate";

const Dashboard = () => {
  const [envelopes, setEnvelopes] = useState([]);
  const [incomeEnvelopes, setIncomeEnvelopes] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [period, setPeriod] = useState("all");
  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all");
  const [transactionSort, setTransactionSort] = useState("newest");

  // Currency State ('USD' or 'PKR')
  const [currency, setCurrency] = useState("PKR");
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

  const getLinkedId = (value) =>
    typeof value === "object" && value !== null ? value._id : value;

  const getEnvelopeSpent = (envId, list = transactions) =>
    list
      .filter((tx) => {
        if (tx.type !== "expense") return false;
        const linkedId = getLinkedId(tx.envelopeId);
        return String(linkedId) === String(envId);
      })
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const getIncomeSpent = (incomeId, list = transactions) =>
    list
      .filter((tx) => {
        if (tx.type !== "expense") return false;
        const linkedId = getLinkedId(tx.incomeSource);
        return String(linkedId) === String(incomeId);
      })
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  // Form states for Expense Envelopes
  const [envName, setEnvName] = useState("");
  const [envAmount, setEnvAmount] = useState("");
  const [editingEnvId, setEditingEnvId] = useState(null);

  // Form states for Income Envelopes
  const [incomeEnvName, setIncomeEnvName] = useState("");
  const [incomeEnvAmount, setIncomeEnvAmount] = useState("");
  const [editingIncomeEnvId, setEditingIncomeEnvId] = useState(null);

  // Form states for Transactions
  const [txTitle, setTxTitle] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txType, setTxType] = useState("expense");
  const [txEnvelope, setTxEnvelope] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [incomeSource, setIncomeSource] = useState("");
  const [txIncomeEnvelope, setTxIncomeEnvelope] = useState(""); // Dedicated state for Income Transactions
  const [purpose, setPurpose] = useState("");
  const [txDate, setTxDate] = useState("");
  const [taxPercentage, setTaxPercentage] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [taxApplication, setTaxApplication] = useState("exclusive");

  // State for tracking transaction being edited
  const [editingTxId, setEditingTxId] = useState(null);
  // Dropdown visibility for income sources selector
  const [showIncomeDropdown, setShowIncomeDropdown] = useState(false);
  const symbol = currency === "PKR" ? "Rs " : "$";

  // Refs to specific forms so we can scroll to the appropriate form
  const transactionFormRef = useRef(null);
  const envelopeFormRef = useRef(null);
  const incomeFormRef = useRef(null);

  const loadData = React.useCallback(async () => {
    try {
      const envRes = await fetchEnvelopes();
      setEnvelopes(envRes.data);

      try {
        const incomeEnvRes = await fetchIncomeEnvelopes();
        setIncomeEnvelopes(incomeEnvRes.data);
      } catch (e) {
        console.warn("Income envelopes fetch skipped or endpoint not ready:", e);
      }

      const txRes = await fetchTransactions(period);
      setTransactions(txRes.data);
    } catch (err) {
      console.error(err);
    }
  }, [period]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const envRes = await fetchEnvelopes();
        if (!isMounted) return;
        setEnvelopes(envRes.data);

        try {
          const incomeEnvRes = await fetchIncomeEnvelopes();
          if (!isMounted) return;
          setIncomeEnvelopes(incomeEnvRes.data);
        } catch (e) {
          console.warn("Income envelopes fetch skipped or endpoint not ready:", e);
        }

        const txRes = await fetchTransactions(period);
        if (!isMounted) return;
        setTransactions(txRes.data);
      } catch (err) {
        console.error(err);
      }
    };

    void fetchData();

    return () => {
      isMounted = false;
    };
  }, [period]);

  useEffect(() => {
    localStorage.setItem(
      "budgetTrackerAnalyticsData",
      JSON.stringify({
        transactions,
        incomeEnvelopes,
        currency,
        conversionRate,
      }),
    );
  }, [transactions, incomeEnvelopes, currency, conversionRate]);

  // Expense Envelope Handlers
  const handleCreateEnvelope = async (e) => {
    e.preventDefault();
    if (!envName || !envAmount) return;

    const baseAmountInput =
      currency === "PKR"
        ? Number(envAmount) / conversionRate
        : Number(envAmount);

    if (Number.isNaN(baseAmountInput) || baseAmountInput <= 0) {
      alert("Please enter a valid positive envelope budget.");
      return;
    }

    if (editingEnvId) {
      const currentSpent = getEnvelopeSpent(editingEnvId);
      if (baseAmountInput < currentSpent) {
        alert(
          `Cannot lower this envelope below the current spent amount (${symbol}${formatAmount(currentSpent)}).`,
        );
        return;
      }

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

  // Income Envelope Handlers
  const handleCreateIncomeEnvelope = async (e) => {
    e.preventDefault();
    if (!incomeEnvName || !incomeEnvAmount) return;

    const baseAmountInput =
      currency === "PKR"
        ? Number(incomeEnvAmount) / conversionRate
        : Number(incomeEnvAmount);

    if (Number.isNaN(baseAmountInput) || baseAmountInput <= 0) {
      alert("Please enter a valid positive income envelope amount.");
      return;
    }

    if (editingIncomeEnvId) {
      const currentSpent = getIncomeSpent(editingIncomeEnvId);
      if (baseAmountInput < currentSpent) {
        alert(
          `Cannot lower this income envelope below the current amount already spent (${symbol}${formatAmount(currentSpent)}).`,
        );
        return;
      }

      await updateIncomeEnvelope(editingIncomeEnvId, {
        name: incomeEnvName,
        allocatedAmount: baseAmountInput,
      });
      setEditingIncomeEnvId(null);
    } else {
      await addIncomeEnvelope({
        name: incomeEnvName,
        allocatedAmount: baseAmountInput,
      });
    }

    setIncomeEnvName("");
    setIncomeEnvAmount("");
    loadData();
  };

  const handleUpdateIncomeEnvelope = (id) => {
    const incomeEnvToEdit = incomeEnvelopes.find((env) => env._id === id);
    if (incomeEnvToEdit) {
      setEditingIncomeEnvId(incomeEnvToEdit._id);
      setIncomeEnvName(incomeEnvToEdit.name);
      const displayedVal =
        currency === "PKR"
          ? incomeEnvToEdit.allocatedAmount * conversionRate
          : incomeEnvToEdit.allocatedAmount;
      setIncomeEnvAmount(displayedVal.toFixed(2));
      setTimeout(() => {
        incomeFormRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 60);
    }
  };

  const handleDeleteIncomeEnvelope = async (id) => {
    await removeIncomeEnvelope(id);
    if (editingIncomeEnvId === id) {
      setEditingIncomeEnvId(null);
      setIncomeEnvName("");
      setIncomeEnvAmount("");
    }
    loadData();
  };

  // Transfer Between Envelopes Handler
  const handleTransferBetweenEnvelopes = async (type, fromId, toId, rawTransferAmount) => {
    try {
      const baseTransferAmount =
        currency === "PKR" ? rawTransferAmount / conversionRate : rawTransferAmount;

      if (type === "expense") {
        const sourceEnv = envelopes.find((e) => e._id === fromId);
        const destEnv = envelopes.find((e) => e._id === toId);
        if (!sourceEnv || !destEnv) return;

        const newSourceAmount = Math.max(0, (sourceEnv.allocatedAmount || 0) - baseTransferAmount);
        const newDestAmount = (destEnv.allocatedAmount || 0) + baseTransferAmount;

        await updateEnvelope(fromId, { allocatedAmount: newSourceAmount });
        await updateEnvelope(toId, { allocatedAmount: newDestAmount });
      } else {
        const sourceInc = incomeEnvelopes.find((e) => e._id === fromId);
        const destInc = incomeEnvelopes.find((e) => e._id === toId);
        if (!sourceInc || !destInc) return;

        const newSourceAmount = Math.max(0, (sourceInc.allocatedAmount || 0) - baseTransferAmount);
        const newDestAmount = (destInc.allocatedAmount || 0) + baseTransferAmount;

        await updateIncomeEnvelope(fromId, { allocatedAmount: newSourceAmount });
        await updateIncomeEnvelope(toId, { allocatedAmount: newDestAmount });
      }

      loadData();
    } catch (error) {
      console.error("Error transferring funds between envelopes:", error);
      alert("Failed to transfer funds.");
    }
  };

  // Populate transaction fields into form for editing
  const handleStartEditTransaction = (tx) => {
    setEditingTxId(tx._id);
    setTxTitle(tx.title || "");

    const displayedAmount =
      currency === "PKR" ? tx.amount * conversionRate : tx.amount;
    setTxAmount(displayedAmount.toFixed(2));

    setTxType(tx.type || "expense");
    setTxEnvelope(tx.envelopeId?._id || tx.envelopeId || "");
    setPaymentMethod(
      tx.paymentMethod ? tx.paymentMethod.toLowerCase() : "cash",
    );
    setIncomeSource(tx.type === "expense" ? (tx.incomeSource?._id || tx.incomeSource || "") : "");
    setTxIncomeEnvelope(tx.type === "income" ? (tx.incomeSource?._id || tx.incomeSource || "") : "");
    setPurpose(tx.purpose || "");

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

    setTimeout(() => {
      transactionFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 60);
  };

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
    setIncomeSource("");
    setTxIncomeEnvelope("");
  };

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

      // 1. Build transactionData payload
      const transactionData = {
        title: txTitle,
        amount: finalAmount,
        type: txType,
        envelopeId: txType === "expense" && txEnvelope ? txEnvelope : undefined,
        paymentMethod: paymentMethod,
        incomeSource:
          txType === "expense" 
            ? (incomeSource || undefined) 
            : (txType === "income" ? (txIncomeEnvelope || undefined) : undefined),
        purpose: purpose || undefined,
        taxPercentage: calculatedTaxPercentage || undefined,
        taxAmount: calculatedTaxAmount || undefined,
        taxApplication: taxApplication,
        date: txDate ? new Date(txDate) : new Date(),
      };

      // 2. Handle Edit & Income Envelope Adjustments
      if (editingTxId) {
        const existingTx = transactions.find((tx) => tx._id === editingTxId);

        if (existingTx && existingTx.type === "expense" && transactionData.type === "expense") {
          const linkedExpenseEnvelope = transactionData.envelopeId;
          const currentEnvelopeSpent = getEnvelopeSpent(linkedExpenseEnvelope, transactions.filter((tx) => tx._id !== editingTxId));
          const projectedEnvelopeSpend = currentEnvelopeSpent + finalAmount;
          const selectedEnvelope = envelopes.find((env) => String(env._id) === String(linkedExpenseEnvelope));
          if (selectedEnvelope && projectedEnvelopeSpend > Number(selectedEnvelope.allocatedAmount || 0)) {
            alert(
              `This expense would exceed the selected envelope budget (${symbol}${formatAmount(Number(selectedEnvelope.allocatedAmount || 0))}).`,
            );
            return;
          }
        }

        if (existingTx && existingTx.type === "income") {
          const oldIncomeId = existingTx.incomeSource?._id || existingTx.incomeSource;
          const newIncomeId = transactionData.incomeSource;
          const oldAmount = Number(existingTx.amount || 0);

          if (oldIncomeId && oldIncomeId === newIncomeId) {
            const diff = finalAmount - oldAmount;
            if (diff !== 0) {
              const targetEnv = incomeEnvelopes.find((e) => e._id === oldIncomeId);
              if (targetEnv) {
                await updateIncomeEnvelope(oldIncomeId, {
                  name: targetEnv.name,
                  allocatedAmount: Math.max(0, Number(targetEnv.allocatedAmount || 0) + diff),
                });
              }
            }
          } else {
            if (oldIncomeId) {
              const oldEnv = incomeEnvelopes.find((e) => e._id === oldIncomeId);
              if (oldEnv) {
                await updateIncomeEnvelope(oldIncomeId, {
                  name: oldEnv.name,
                  allocatedAmount: Math.max(0, Number(oldEnv.allocatedAmount || 0) - oldAmount),
                });
              }
            }
            if (newIncomeId) {
              const newEnv = incomeEnvelopes.find((e) => e._id === newIncomeId);
              if (newEnv) {
                await updateIncomeEnvelope(newIncomeId, {
                  name: newEnv.name,
                  allocatedAmount: Number(newEnv.allocatedAmount || 0) + finalAmount,
                });
              }
            }
          }
        }

        const res = await updateTransaction(editingTxId, transactionData);
        setTransactions((prev) =>
          prev.map((tx) => (tx._id === editingTxId ? res.data : tx)),
        );
        setEditingTxId(null);
      } 
      else {
        // 3. Handle New Transactions
        if (
          transactionData.type === "expense" &&
          transactionData.incomeSource
        ) {
          const incomeId = transactionData.incomeSource;
          const selectedIncEnv = incomeEnvelopes.find((e) => e._id === incomeId);
          const spent = transactions
            .filter(
              (t) =>
                t.type === "expense" &&
                (t.incomeSource?._id === incomeId ||
                  t.incomeSource === incomeId),
            )
            .reduce((acc, t) => acc + Number(t.amount || 0), 0);
          const incomeAmount = selectedIncEnv ? Number(selectedIncEnv.allocatedAmount || 0) : 0;
          const remaining = incomeAmount - spent;
          if (remaining < finalAmount) {
            alert(
              "Selected income envelope does not have sufficient remaining funds to cover this expense.",
            );
            return;
          }
        }

        const response = await addTransaction(transactionData);
        
        if (transactionData.type === "income" && transactionData.incomeSource) {
          const incomeId = transactionData.incomeSource;
          const targetIncEnv = incomeEnvelopes.find((e) => e._id === incomeId);
          if (targetIncEnv) {
            const newAllocated = Number(targetIncEnv.allocatedAmount || 0) + finalAmount;
            await updateIncomeEnvelope(incomeId, {
              name: targetIncEnv.name,
              allocatedAmount: newAllocated,
            });
          }
        }

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
    const targetTx = transactions.find((tx) => tx._id === id);

    if (targetTx?.type === "income" && targetTx.incomeSource) {
      const incomeId = getLinkedId(targetTx.incomeSource);
      const targetEnv = incomeEnvelopes.find((env) => String(env._id) === String(incomeId));
      if (targetEnv) {
        await updateIncomeEnvelope(incomeId, {
          name: targetEnv.name,
          allocatedAmount: Math.max(0, Number(targetEnv.allocatedAmount || 0) - Number(targetTx.amount || 0)),
        });
      }
    }

    await removeTransaction(id);
    if (editingTxId === id) {
      handleCancelEditTransaction();
    }
    loadData();
  };

  const handleImportTransactions = async (rows = []) => {
    if (!rows.length) return;

    let importedCount = 0;
    for (const row of rows) {
      try {
        await addTransaction(row);
        importedCount += 1;
      } catch (error) {
        console.error("Failed to import row:", row, error);
      }
    }

    if (importedCount > 0) {
      await loadData();
      alert(`${importedCount} transaction(s) imported successfully.`);
    } else {
      alert("No valid transactions were imported. Please check the CSV format.");
    }
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
    <div className="min-h-screen bg-slate-950/80 text-slate-100 p-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:p-6 sm:pb-8 w-full max-w-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-8 w-full">
        <Navbar/>
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
          envelopes={incomeEnvelopes}
          formatAmount={formatAmount}
        />

        <Analysis period={period} setPeriod={setPeriod} />

        <Header
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          totalTax={totalTax}
          currency={currency}
          formatAmount={formatAmount}
          incomeEnvelopes={incomeEnvelopes}
          transactions={transactions}
        />

        <Maincontent
          handleUpdateTransaction={handleUpdateTransaction}
          handleCreateEnvelope={handleCreateEnvelope}
          envName={envName}
          setEnvName={setEnvName}
          envAmount={envAmount}
          setEnvAmount={setEnvAmount}
          envelopes={envelopes}
          incomeEnvelopes={incomeEnvelopes}
          incomeEnvName={incomeEnvName}
          setIncomeEnvName={setIncomeEnvName}
          incomeEnvAmount={incomeEnvAmount}
          setIncomeEnvAmount={setIncomeEnvAmount}
          handleCreateIncomeEnvelope={handleCreateIncomeEnvelope}
          handleUpdateIncomeEnvelope={handleUpdateIncomeEnvelope}
          handleDeleteIncomeEnvelope={handleDeleteIncomeEnvelope}
          editingIncomeEnvId={editingIncomeEnvId}
          setEditingIncomeEnvId={setEditingIncomeEnvId}
          incomeFormRef={incomeFormRef}
          handleTransferBetweenEnvelopes={handleTransferBetweenEnvelopes}
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
          txIncomeEnvelope={txIncomeEnvelope}
          setTxIncomeEnvelope={setTxIncomeEnvelope}
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
          handleImportTransactions={handleImportTransactions}
          currency={currency}
          conversionRate={conversionRate}
          formatAmount={formatAmount}
          editingTxId={editingTxId}
          handleStartEditTransaction={handleStartEditTransaction}
          handleCancelEditTransaction={handleCancelEditTransaction}
          transactionFormRef={transactionFormRef}
          envelopeFormRef={envelopeFormRef}
          transactionSearch={transactionSearch}
          setTransactionSearch={setTransactionSearch}
          transactionTypeFilter={transactionTypeFilter}
          setTransactionTypeFilter={setTransactionTypeFilter}
          transactionSort={transactionSort}
          setTransactionSort={setTransactionSort}
        />
      </div>
    </div>
  );
};

export default Dashboard;