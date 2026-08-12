import React, { useState, useEffect } from 'react';
import { 
  fetchEnvelopes, addEnvelope, removeEnvelope, 
  fetchTransactions, addTransaction, removeTransaction 
} from '../services/api';

const Dashboard = () => {
  const [envelopes, setEnvelopes] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [period, setPeriod] = useState('monthly');

  // Form states for Envelopes
  const [envName, setEnvName] = useState('');
  const [envAmount, setEnvAmount] = useState('');

  // Form states for Transactions
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState('expense');
  const [txEnvelope, setTxEnvelope] = useState('');

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
    await addEnvelope({ name: envName, allocatedAmount: Number(envAmount) });
    setEnvName(''); setEnvAmount('');
    loadData();
  };

  const handleDeleteEnvelope = async (id) => {
    await removeEnvelope(id);
    loadData();
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    if (!txTitle || !txAmount) return;
    await addTransaction({
      title: txTitle,
      amount: Number(txAmount),
      type: txType,
      envelopeId: txType === 'expense' ? txEnvelope : undefined
    });
    setTxTitle(''); setTxAmount(''); setTxEnvelope('');
    loadData();
  };

  const handleDeleteTransaction = async (id) => {
    await removeTransaction(id);
    loadData();
  };

  // Calculations
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header and Period Filter */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-6 rounded-xl border border-slate-800 gap-4">
          <div>
            <h2 className="text-2xl font-bold">Financial Overview</h2>
            <p className="text-slate-400 text-sm">Manage envelopes and view spending history across intervals.</p>
          </div>
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            {['weekly', 'monthly', 'yearly'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-md text-sm capitalize font-medium transition ${period === p ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Analytics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <p className="text-slate-400 text-sm font-medium">Total Income</p>
            <h3 className="text-3xl font-bold text-emerald-400 mt-2">${totalIncome.toFixed(2)}</h3>
          </div>
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <p className="text-slate-400 text-sm font-medium">Total Expenses</p>
            <h3 className="text-3xl font-bold text-rose-400 mt-2">${totalExpense.toFixed(2)}</h3>
          </div>
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <p className="text-slate-400 text-sm font-medium">Net Savings</p>
            <h3 className={`text-3xl font-bold mt-2 ${totalIncome - totalExpense >= 0 ? 'text-indigo-400' : 'text-rose-500'}`}>
              ${(totalIncome - totalExpense).toFixed(2)}
            </h3>
          </div>
        </div>

        {/* Grid for Envelopes and Transactions Setup */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Envelopes Section */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-6">
            <h3 className="text-xl font-bold">Budget Envelopes</h3>
            <form onSubmit={handleCreateEnvelope} className="space-y-4">
              <input type="text" placeholder="Envelope Name (e.g. Groceries)" value={envName} onChange={(e) => setEnvName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white" required />
              <input type="number" placeholder="Allocated Limit ($)" value={envAmount} onChange={(e) => setEnvAmount(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white" required />
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded font-medium transition">Create Envelope</button>
            </form>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {envelopes.map((env) => {
                const spent = transactions
                  .filter(t => t.envelopeId?._id === env._id || t.envelopeId === env._id)
                  .reduce((acc, t) => acc + t.amount, 0);
                const pct = Math.min((spent / env.allocatedAmount) * 100, 100);

                return (
                  <div key={env._id} className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{env.name}</span>
                      <button onClick={() => handleDeleteEnvelope(env._id)} className="text-rose-400 text-xs hover:underline">Delete</button>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Spent: ${spent.toFixed(2)}</span>
                      <span>Limit: ${env.allocatedAmount}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${pct > 90 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transactions Section */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-6">
            <h3 className="text-xl font-bold">Add Transaction</h3>
            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <input type="text" placeholder="Title (e.g. Grocery Store)" value={txTitle} onChange={(e) => setTxTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white" required />
              <input type="number" placeholder="Amount ($)" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white" required />
              <div className="flex gap-4">
                <select value={txType} onChange={(e) => setTxType(e.target.value)} className="w-1/2 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white">
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
                {txType === 'expense' && (
                  <select value={txEnvelope} onChange={(e) => setTxEnvelope(e.target.value)} className="w-1/2 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white" required>
                    <option value="">Select Envelope</option>
                    {envelopes.map(env => <option key={env._id} value={env._id}>{env.name}</option>)}
                  </select>
                )}
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 py-2 rounded font-medium transition">Save Transaction</button>
            </form>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {transactions.map((tx) => (
                <div key={tx._id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm">{tx.title}</p>
                    <p className="text-xs text-slate-400">
                      {tx.type === 'expense' ? `Envelope: ${tx.envelopeId?.name || 'General'}` : 'Income'} • {new Date(tx.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}${tx.amount}
                    </span>
                    <button onClick={() => handleDeleteTransaction(tx._id)} className="text-rose-500 text-xs">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;