import React, { useState, useEffect } from "react";
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

const Dashboard = () => {
  const [envelopes, setEnvelopes] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [period, setPeriod] = useState("monthly");

  // NEW: Currency State ('USD' or 'PKR')
  const [currency, setCurrency] = useState("USD");
  const conversionRate = 277.42; // Standard USD to PKR exchange rate reference

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
  const [purpose, setPurpose] = useState("");
  const [txDate, setTxDate] = useState("");
  const [taxPercentage, setTaxPercentage] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [taxApplication, setTaxApplication] = useState("exclusive");

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

    // If user enters amount in PKR while viewing PKR, store normalized USD value or keep raw depending on preference. 
    // Assuming inputs are typed in the active currency view:
    const baseAmountInput = currency === "PKR" ? Number(envAmount) / conversionRate : Number(envAmount);

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
      // Display value matching active currency view
      const displayedVal = currency === "PKR" 
        ? envelopeToEdit.allocatedAmount * conversionRate 
        : envelopeToEdit.allocatedAmount;
      setEnvAmount(displayedVal.toFixed(2));
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

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    try {
      let rawInputAmount = parseFloat(txAmount);
      // Normalize to USD for database persistence if entered during PKR view
      let rawAmount = currency === "PKR" ? rawInputAmount / conversionRate : rawInputAmount;
      
      let calculatedTaxAmount = taxAmount ? parseFloat(taxAmount) : 0;
      if (currency === "PKR" && taxAmount) calculatedTaxAmount /= conversionRate;

      let calculatedTaxPercentage = taxPercentage ? parseFloat(taxPercentage) : 0;
      let finalAmount = rawAmount;

      if (calculatedTaxPercentage > 0 && !taxAmount) {
        calculatedTaxAmount = (rawAmount * calculatedTaxPercentage) / 100;
      }

      if (txType === 'expense' && (calculatedTaxAmount > 0 || calculatedTaxPercentage > 0)) {
        if (taxApplication === 'exclusive') {
          finalAmount = rawAmount + calculatedTaxAmount;
        } else if (taxApplication === 'inclusive') {
          finalAmount = rawAmount; 
        }
      }

      const transactionData = {
        title: txTitle,
        amount: finalAmount,
        type: txType,
        envelopeId: txType === 'expense' ? txEnvelope : undefined,
        paymentMethod: paymentMethod,
        purpose: purpose,
        taxPercentage: calculatedTaxPercentage || undefined,
        taxAmount: calculatedTaxAmount || undefined,
        taxApplication: taxApplication, 
        date: txDate || new Date()
      };

      const response = await addTransaction(transactionData);
      setTransactions([response.data, ...transactions]);

      setTxTitle('');
      setTxAmount('');
      setPurpose('');
      setTaxPercentage('');
      setTaxAmount('');
      setTaxApplication('exclusive');
      setPaymentMethod('cash');
      setTxDate('');
    } catch (error) {
      console.error('Error creating transaction:', error.response?.data?.message || error.message);
    }
  };

  const handleUpdateTransaction = async (id, updateData) => {
    try {
      const res = await updateTransaction(id, updateData);
      setTransactions((prev) => prev.map((tx) => (tx._id === id ? res.data : tx)));
    } catch (error) {
      console.error("Failed to update transaction:", error);
    }
  };

  const handleDeleteTransaction = async (id) => {
    await removeTransaction(id);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Control Bar with Currency Switcher Button */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800 gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Expense Dashboard</h1>
            <p className="text-xs text-slate-400">Manage your budget, envelopes, and taxes seamlessly.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-300">Display Currency:</span>
            <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex gap-1">
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`px-3 py-1 rounded text-xs font-semibold transition ${
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
                className={`px-3 py-1 rounded text-xs font-semibold transition ${
                  currency === "PKR" 
                    ? "bg-emerald-600 text-white shadow" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                PKR (Rs)
              </button>
            </div>
          </div>
        </div>

        {/* Header and Period Filter */}
        <Analysis period={period} setPeriod={setPeriod} />

        {/* Analytics Summary with Currency Prop */}
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
          formatAmount={formatAmount}
        />
      </div>
    </div>
  );
};

export default Dashboard;