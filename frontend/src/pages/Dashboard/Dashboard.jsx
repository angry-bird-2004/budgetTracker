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
// import FillEnvelopes from "../FillEnvelopes";

const Dashboard = () => {
  const [envelopes, setEnvelopes] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [period, setPeriod] = useState("monthly");

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

    if (editingEnvId) {
      await updateEnvelope(editingEnvId, {
        name: envName,
        allocatedAmount: Number(envAmount),
      });
      setEditingEnvId(null);
    } else {
      await addEnvelope({ name: envName, allocatedAmount: Number(envAmount) });
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
      setEnvAmount(envelopeToEdit.allocatedAmount);
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
      let rawAmount = parseFloat(txAmount);
      let calculatedTaxAmount = taxAmount ? parseFloat(taxAmount) : 0;
      let calculatedTaxPercentage = taxPercentage ? parseFloat(taxPercentage) : 0;
      let finalAmount = rawAmount;

      // Handle calculations if percentage tax is provided
      if (calculatedTaxPercentage > 0 && !taxAmount) {
        calculatedTaxAmount = (rawAmount * calculatedTaxPercentage) / 100;
      }

      // Adjust amount based on tax application type (Expense only)
      if (txType === 'expense' && (calculatedTaxAmount > 0 || calculatedTaxPercentage > 0)) {
        if (taxApplication === 'exclusive') {
          // Add tax on top of the base amount
          finalAmount = rawAmount + calculatedTaxAmount;
        } else if (taxApplication === 'inclusive') {
          // Tax is already included, or you can extract/keep the base amount depending on your tracking preference. 
          // If you want the total recorded amount to remain as entered, or if you need to strip the tax component:
          finalAmount = rawAmount; 
        }
      }

      const transactionData = {
        title: txTitle,
        amount: finalAmount, // Updated amount reflecting tax rules
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

      // Reset form fields
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
  // In your Parent Component (e.g., Dashboard.jsx or App.jsx)

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* <FillEnvelopes/> */}
        {/* Header and Period Filter */}
        <Analysis period={period} setPeriod={setPeriod} />

        {/* Analytics Summary */}
        <Header totalIncome={totalIncome} totalExpense={totalExpense} />

        {/* Grid for Envelopes and Transactions Setup */}
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
        />
      </div>
    </div>
  );
};

export default Dashboard;