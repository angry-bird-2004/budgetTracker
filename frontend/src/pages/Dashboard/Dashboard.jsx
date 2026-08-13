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
    if (!txTitle || !txAmount) return;
    await addTransaction({
      title: txTitle,
      amount: Number(txAmount),
      type: txType,
      envelopeId: txType === "expense" ? txEnvelope : undefined,
    });
    setTxTitle("");
    setTxAmount("");
    setTxEnvelope("");
    loadData();
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
          handleDeleteTransaction={handleDeleteTransaction}
        />
      </div>
    </div>
  );
};

export default Dashboard;