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
  transferFunds,
} from "../../services/api";
import Navbar from "../../components/Navbar";
import Header from "./Header/Header";
import { Suspense, lazy } from "react";
const Analysis = lazy(() => import("./Analysis/Analysis"));
const Maincontent = lazy(() => import("./MainContent/Maincontent"));
const Currency = lazy(() => import("./Currency/Currency"));
import { useExchangeRate } from "../../Hooks/useExchangeRate";
import { toBaseAmount, fromBaseAmount } from "../../utils/amounts";
import { toLocalDateInput, fromLocalDateInput } from "../../utils/dates";

const Dashboard = () => {
  const [envelopes, setEnvelopes] = useState([]);
  const [incomeEnvelopes, setIncomeEnvelopes] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [txPage, setTxPage] = useState(1);
  const [txPages, setTxPages] = useState(1);
  const [txTotal, setTxTotal] = useState(0);
  const [txLimit, setTxLimit] = useState(50);
  const [txTotals, setTxTotals] = useState({ income: 0, expense: 0, tax: 0 });
  const [period, setPeriod] = useState("all");
  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all");
  const [transactionSort, setTransactionSort] = useState("newest");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [envelopesLoading, setEnvelopesLoading] = useState(false);
  const [incomeEnvelopesLoading, setIncomeEnvelopesLoading] = useState(false);

  const [currency, setCurrency] = useState("PKR");
  const { conversionRate, loading } = useExchangeRate();

  const formatAmount = (val) => {
    const num = Number(val) || 0;
    const converted = currency === "PKR" ? num : num / conversionRate;
    return converted.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getEnvelopeSpent = (envId) => {
    const env = envelopes.find((item) => String(item._id) === String(envId));
    return Number(env?.consumed || 0);
  };

  const getIncomeSpent = (incomeId) => {
    const env = incomeEnvelopes.find(
      (item) => String(item._id) === String(incomeId),
    );
    return Number(env?.consumed || 0);
  };

  const [envName, setEnvName] = useState("");
  const [envAmount, setEnvAmount] = useState("");
  const [editingEnvId, setEditingEnvId] = useState(null);

  const [incomeEnvName, setIncomeEnvName] = useState("");
  const [incomeEnvAmount, setIncomeEnvAmount] = useState("");
  const [editingIncomeEnvId, setEditingIncomeEnvId] = useState(null);

  const [txTitle, setTxTitle] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txType, setTxType] = useState("expense");
  const [txEnvelope, setTxEnvelope] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [incomeSource, setIncomeSource] = useState("");
  const [txIncomeEnvelope, setTxIncomeEnvelope] = useState("");
  const [purpose, setPurpose] = useState("");
  const [txDate, setTxDate] = useState("");
  const [taxPercentage, setTaxPercentage] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [taxApplication, setTaxApplication] = useState("exclusive");

  const [editingTxId, setEditingTxId] = useState(null);
  const [showIncomeDropdown, setShowIncomeDropdown] = useState(false);
  const symbol = currency === "PKR" ? "Rs " : "$";

  const transactionFormRef = useRef(null);
  const envelopeFormRef = useRef(null);
  const incomeFormRef = useRef(null);
  const analyticsTimer = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState(transactionSearch);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(transactionSearch), 300);
    return () => clearTimeout(timer);
  }, [transactionSearch]);

  const loadTransactions = React.useCallback(
    async (page = 1, append = false) => {
      setTransactionsLoading(true);
      try {
        const txRes = await fetchTransactions(period, page, txLimit, {
          search: debouncedSearch,
          type: transactionTypeFilter,
          sort: transactionSort,
        });
        const { transactions: txs, total, pages, totals } = txRes.data;
        setTxPage(page);
        setTxPages(pages);
        setTxTotal(total);
        if (totals) {
          setTxTotals({
            income: Number(totals.income || 0),
            expense: Number(totals.expense || 0),
            tax: Number(totals.tax || 0),
          });
        }
        if (append)
          setTransactions((prev) => [
            ...(prev || []),
            ...(Array.isArray(txs) ? txs : []),
          ]);
        else setTransactions(Array.isArray(txs) ? txs : []);
      } catch (err) {
        console.error(err);
      } finally {
        setTransactionsLoading(false);
      }
    },
    [period, txLimit, debouncedSearch, transactionTypeFilter, transactionSort],
  );

  const loadEnvelopes = React.useCallback(async () => {
    setEnvelopesLoading(true);
    setIncomeEnvelopesLoading(true);
    try {
      const envRes = await fetchEnvelopes();
      setEnvelopes(Array.isArray(envRes.data) ? envRes.data : []);

      try {
        const incomeEnvRes = await fetchIncomeEnvelopes();
        setIncomeEnvelopes(
          Array.isArray(incomeEnvRes.data) ? incomeEnvRes.data : [],
        );
      } catch (e) {
        console.warn(
          "Income envelopes fetch skipped or endpoint not ready:",
          e,
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEnvelopesLoading(false);
      setIncomeEnvelopesLoading(false);
    }
  }, []);

  const loadData = React.useCallback(async () => {
    try {
      await Promise.all([loadEnvelopes(), loadTransactions(1, false)]);
    } finally {
      setIsInitialLoad(false);
    }
  }, [loadEnvelopes, loadTransactions]);

  useEffect(() => {
    void loadEnvelopes();
  }, [loadEnvelopes]);

  useEffect(() => {
    let isMounted = true;

    const fetchPage = async () => {
      await loadTransactions(1, false);
      if (isMounted) setIsInitialLoad(false);
    };

    void fetchPage();

    return () => {
      isMounted = false;
    };
  }, [loadTransactions]);

  useEffect(() => {
    const timer = analyticsTimer.current;
    if (timer) clearTimeout(timer);

    analyticsTimer.current = setTimeout(() => {
      try {
        const txs = Array.isArray(transactions) ? transactions : [];
        const incEnvs = Array.isArray(incomeEnvelopes) ? incomeEnvelopes : [];

        const totalIncome = txTotals.income;
        const totalExpense = txTotals.expense;
        const totalTax = txTotals.tax;

        const summary = {
          transactions: txs, // Required for graph rendering
          incomeEnvelopes: incEnvs, // Required for analytics breakdown
          transactionCount: txTotal,
          incomeEnvelopeCount: incEnvs.length,
          totalIncome,
          totalExpense,
          totalTax,
          currency,
          conversionRate,
          updatedAt: Date.now(),
        };

        try {
          localStorage.setItem(
            "budgetTrackerAnalyticsData",
            JSON.stringify(summary),
          );
        } catch (e) {
          console.warn("Failed to write analytics to localStorage:", e);
        }
      } catch (e) {
        console.warn("Failed to build analytics summary:", e);
      }
    }, 1500);

    return () => {
      const t = analyticsTimer.current;
      if (t) clearTimeout(t);
    };
  }, [transactions, incomeEnvelopes, currency, conversionRate, txTotals, txTotal]);

  const handleCreateEnvelope = async (e) => {
    e.preventDefault();
    if (!envName || !envAmount || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const baseAmountInput = toBaseAmount(envAmount, currency, conversionRate);

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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEnvelope = (id) => {
    const envelopeToEdit = envelopes.find((env) => env._id === id);
    if (envelopeToEdit) {
      setEditingEnvId(envelopeToEdit._id);
      setEnvName(envelopeToEdit.name);
      const displayedVal = fromBaseAmount(
        envelopeToEdit.allocatedAmount,
        currency,
        conversionRate,
      );
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
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await removeEnvelope(id);
      if (editingEnvId === id) {
        setEditingEnvId(null);
        setEnvName("");
        setEnvAmount("");
      }
      loadData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateIncomeEnvelope = async (e) => {
    e.preventDefault();
    if (!incomeEnvName || !incomeEnvAmount || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const baseAmountInput = toBaseAmount(
        incomeEnvAmount,
        currency,
        conversionRate,
      );

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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateIncomeEnvelope = (id) => {
    const incomeEnvToEdit = incomeEnvelopes.find((env) => env._id === id);
    if (incomeEnvToEdit) {
      setEditingIncomeEnvId(incomeEnvToEdit._id);
      setIncomeEnvName(incomeEnvToEdit.name);
      const displayedVal = fromBaseAmount(
        incomeEnvToEdit.allocatedAmount,
        currency,
        conversionRate,
      );
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
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await removeIncomeEnvelope(id);
      if (editingIncomeEnvId === id) {
        setEditingIncomeEnvId(null);
        setIncomeEnvName("");
        setIncomeEnvAmount("");
      }
      loadData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransferBetweenEnvelopes = async (
    type,
    fromId,
    toId,
    rawTransferAmount,
  ) => {
    if (isSubmitting) {
      throw new Error("Another request is already in progress.");
    }
    setIsSubmitting(true);

    try {
      const baseTransferAmount = toBaseAmount(
        rawTransferAmount,
        currency,
        conversionRate,
      );

      if (!Number.isFinite(baseTransferAmount) || baseTransferAmount <= 0) {
        throw new Error("Enter a valid transfer amount.");
      }

      await transferFunds({
        type,
        fromId,
        toId,
        amount: baseTransferAmount,
      });

      await loadData();
    } catch (error) {
      console.error("Error transferring funds between envelopes:", error);
      alert(error.response?.data?.message || error.message || "Failed to transfer funds.");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEditTransaction = (tx) => {
    setEditingTxId(tx._id);
    setTxTitle(tx.title || "");

    const displayedAmount = fromBaseAmount(tx.amount, currency, conversionRate);
    setTxAmount(displayedAmount.toFixed(2));

    setTxType(tx.type || "expense");
    setTxEnvelope(tx.envelopeId?._id || tx.envelopeId || "");
    setPaymentMethod(
      tx.paymentMethod ? tx.paymentMethod.toLowerCase() : "cash",
    );
    setIncomeSource(
      tx.type === "expense"
        ? tx.incomeSource?._id || tx.incomeSource || ""
        : "",
    );
    setTxIncomeEnvelope(
      tx.type === "income" ? tx.incomeSource?._id || tx.incomeSource || "" : "",
    );
    setPurpose(tx.purpose || "");

    if (tx.date) {
      setTxDate(toLocalDateInput(tx.date));
    } else {
      setTxDate("");
    }

    setTaxPercentage(tx.taxPercentage ?? "");
    const displayedTax = tx.taxAmount
      ? fromBaseAmount(tx.taxAmount, currency, conversionRate)
      : "";
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
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      let rawInputAmount = parseFloat(txAmount);
      let rawAmount = toBaseAmount(rawInputAmount, currency, conversionRate);

      let calculatedTaxAmount = taxAmount ? parseFloat(taxAmount) : 0;
      if (taxAmount) {
        calculatedTaxAmount = toBaseAmount(
          calculatedTaxAmount,
          currency,
          conversionRate,
        );
      }

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

      const transactionData = {
        title: txTitle,
        amount: finalAmount,
        type: txType,
        envelopeId: txType === "expense" && txEnvelope ? txEnvelope : undefined,
        paymentMethod: paymentMethod,
        incomeSource:
          txType === "expense"
            ? incomeSource || undefined
            : txType === "income"
              ? txIncomeEnvelope || undefined
              : undefined,
        purpose: purpose || undefined,
        taxPercentage: calculatedTaxPercentage || undefined,
        taxAmount: calculatedTaxAmount || undefined,
        taxApplication: taxApplication,
        date: txDate ? fromLocalDateInput(txDate) : new Date(),
      };

      if (editingTxId) {
        const res = await updateTransaction(editingTxId, transactionData);
        setTransactions((prev) =>
          (prev || []).map((tx) => (tx._id === editingTxId ? res.data : tx)),
        );
        setEditingTxId(null);
      } else {
        const response = await addTransaction(transactionData);
        if (txPage === 1) {
          setTransactions((prev) => {
            const base = prev || [];
            const next = [response.data, ...base];
            if (next.length > txLimit) next.pop();
            return next;
          });
        }
        setTxTotal((t) => t + 1);
      }

      handleCancelEditTransaction();
      loadData();
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert("Failed to save transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTransaction = async (id, updateData) => {
    try {
      const res = await updateTransaction(id, updateData);
      setTransactions((prev) =>
        (prev || []).map((tx) => (tx._id === id ? res.data : tx)),
      );
    } catch (error) {
      console.error("Failed to update transaction:", error);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await removeTransaction(id);
      if (editingTxId === id) {
        handleCancelEditTransaction();
      }
      await Promise.all([
        loadEnvelopes(),
        loadTransactions(txPage, false),
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportTransactions = async (rows = []) => {
    if (!rows.length || isSubmitting) return;
    setIsSubmitting(true);

    try {
      let importedCount = 0;
      for (let i = 0; i < rows.length; i += 10) {
        const batch = rows.slice(i, i + 10);
        const results = await Promise.all(
          batch.map((row) =>
            addTransaction(row)
              .then(() => ({ ok: true }))
              .catch(() => ({ ok: false })),
          ),
        );
        importedCount += results.filter((r) => r.ok).length;
      }

      if (importedCount > 0) {
        await Promise.all([loadEnvelopes(), loadTransactions(1, false)]);
        alert(`${importedCount} transaction(s) imported successfully.`);
      } else {
        alert("No valid transactions were imported.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalIncome = txTotals.income;
  const totalExpense = txTotals.expense;
  const totalTax = txTotals.tax;

  const isBusy = isSubmitting || isInitialLoad;

  return (
    <div className="min-h-screen bg-slate-950/80 text-slate-100 p-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:p-6 sm:pb-8 w-full max-w-full overflow-x-hidden">
      {isBusy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 px-6 py-5 shadow-xl">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-400" />
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-200">
              {isInitialLoad ? "Loading data" : "Processing"}
            </p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-8 w-full">
        <Navbar />

        <Suspense fallback={<div />}>
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
        </Suspense>

        <Header
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          totalTax={totalTax}
          currency={currency}
          formatAmount={formatAmount}
          incomeEnvelopes={incomeEnvelopes}
          transactions={transactions}
        />

        <Suspense fallback={<div />}>
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
            isSubmitting={isSubmitting}
            transactionsLoading={transactionsLoading}
            envelopesLoading={envelopesLoading}
            incomeEnvelopesLoading={incomeEnvelopesLoading}
            loadTransactions={loadTransactions}
            txPage={txPage}
            txPages={txPages}
            txTotal={txTotal}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default Dashboard;
