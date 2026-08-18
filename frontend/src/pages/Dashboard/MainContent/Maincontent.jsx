import React, { useState } from "react";

const Maincontent = ({
  handleUpdateTransaction,
  handleCreateEnvelope,
  envName,
  setEnvName,
  envAmount,
  setEnvAmount,
  envelopes,
  // Income Envelopes Props
  incomeEnvelopes,
  incomeEnvName,
  setIncomeEnvName,
  incomeEnvAmount,
  setIncomeEnvAmount,
  handleCreateIncomeEnvelope,
  handleUpdateIncomeEnvelope,
  handleDeleteIncomeEnvelope,
  editingIncomeEnvId,
  setEditingIncomeEnvId,
  incomeFormRef,
  // Transfer Feature Props
  handleTransferBetweenEnvelopes,
  transactions,
  handleDeleteEnvelope,
  handleUpdateEnvelope,
  editingEnvId,
  setEditingEnvId,
  handleCreateTransaction,
  txTitle,
  setTxTitle,
  txAmount,
  setTxAmount,
  txType,
  setTxType,
  txEnvelope,
  setTxEnvelope,
  taxApplication,
  setTaxApplication,
  paymentMethod,
  setPaymentMethod,
  incomeSource,
  setIncomeSource,
  // New prop for Income Envelope assignment during transaction creation
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
  handleDeleteTransaction,
  currency,
  formatAmount,
  editingTxId,
  handleStartEditTransaction,
  handleCancelEditTransaction,
  transactionFormRef,
  envelopeFormRef,
}) => {
  const [expandedTxId, setExpandedTxId] = useState(null);
  const [selectedEnvelopeId, setSelectedEnvelopeId] = useState(null);
  const [selectedIncomeEnvId, setSelectedIncomeEnvId] = useState(null);

  // Transfer State Controls
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferType, setTransferType] = useState("expense"); // 'expense' or 'income'
  const [fromEnvId, setFromEnvId] = useState("");
  const [toEnvId, setToEnvId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  const symbol = currency === "PKR" ? "Rs " : "$";

  const executeTransfer = (e) => {
    e.preventDefault();
    if (!fromEnvId || !toEnvId || !transferAmount) return;
    if (fromEnvId === toEnvId) {
      alert("Source and Destination envelopes cannot be the same.");
      return;
    }
    handleTransferBetweenEnvelopes(
      transferType,
      fromEnvId,
      toEnvId,
      parseFloat(transferAmount),
    );
    setShowTransferModal(false);
    setFromEnvId("");
    setToEnvId("");
    setTransferAmount("");
  };

  const handleMaxTransfer = () => {
    const list = transferType === "expense" ? envelopes : incomeEnvelopes;
    const source = list.find((env) => env._id === fromEnvId);
    if (!source) return;

    if (transferType === "expense") {
      const consumed = transactions
        .filter(
          (t) =>
            t.type === "expense" &&
            ((t.envelopeId && t.envelopeId._id === source._id) ||
              t.envelopeId === source._id),
        )
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);
      const remaining = (source.allocatedAmount || 0) - consumed;
      setTransferAmount(remaining > 0 ? remaining.toString() : "0");
    } else {
      setTransferAmount((source.allocatedAmount || 0).toString());
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 w-full max-w-full overflow-x-hidden">
      {/* Left Column: Forms (Transaction, Expense Envelope, Income Envelope) */}
      <div className="space-y-6 lg:col-span-1 w-full min-w-0">
        {/* Transaction Form Card */}
        <div
          ref={transactionFormRef}
          className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm w-full"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold tracking-wide text-slate-200 truncate">
              {editingTxId ? "Edit Transaction" : "New Transaction"}
            </h2>
            {editingTxId && (
              <button
                type="button"
                onClick={handleCancelEditTransaction}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium shrink-0 ml-2"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleCreateTransaction} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setTxType("expense")}
                className={`py-2 sm:py-1.5 text-xs font-medium rounded transition ${
                  txType === "expense"
                    ? "bg-rose-600/20 text-rose-400 border border-rose-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setTxType("income")}
                className={`py-2 sm:py-1.5 text-xs font-medium rounded transition ${
                  txType === "income"
                    ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Income
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Grocery, Salary"
                value={txTitle}
                onChange={(e) => setTxTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Amount ({symbol})
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Expense Envelope Selector */}
            {txType === "expense" && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Budget Envelope
                </label>
                <select
                  required
                  value={txEnvelope}
                  onChange={(e) => setTxEnvelope(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 truncate"
                >
                  <option value="">Select Expense Envelope</option>
                  {envelopes.map((env) => (
                    <option key={env._id} value={env._id}>
                      {env.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Income Envelope Selector (Appears when txType is 'income') */}
            {txType === "income" && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Income Envelope
                </label>
                <select
                  required
                  value={txIncomeEnvelope || ""}
                  onChange={(e) => setTxIncomeEnvelope(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 truncate"
                >
                  <option value="">Select Income Envelope Target</option>
                  {incomeEnvelopes.map((inc) => {
                    // Calculate spent amount for this specific income envelope
                    const spentForThisEnv = transactions
                      .filter(
                        (t) =>
                          t.type === "expense" &&
                          (t.incomeSource?._id === inc._id ||
                            t.incomeSource === inc._id),
                      )
                      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

                    // Calculate remaining amount
                    const remainingForThisEnv =
                      Number(inc.allocatedAmount || 0) - spentForThisEnv;

                    return (
                      <option key={inc._id} value={inc._id}>
                        {inc.name} (Rem: {symbol}
                        {formatAmount(remainingForThisEnv)})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>

            {txType === "expense" && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Pay From Income Envelope
                </label>
                <select
                  required
                  value={incomeSource}
                  onChange={(e) => setIncomeSource(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 truncate"
                >
                  <option value="">Select Income Envelope Source</option>
                  {incomeEnvelopes.map((inc) => {
                    // Calculate spent amount for this specific income envelope
                    const spentForThisEnv = transactions
                      .filter(
                        (t) =>
                          t.type === "expense" &&
                          (t.incomeSource?._id === inc._id ||
                            t.incomeSource === inc._id),
                      )
                      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

                    // Calculate remaining amount
                    const remainingForThisEnv =
                      Number(inc.allocatedAmount || 0) - spentForThisEnv;

                    return (
                      <option key={inc._id} value={inc._id}>
                        {inc.name} (Rem: {symbol}
                        {formatAmount(remainingForThisEnv)})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Purpose / Notes
              </label>
              <input
                type="text"
                placeholder="Reason or notes..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            {txType === "expense" && (
              <div className="space-y-3 pt-2 border-t border-slate-800 min-w-0">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Tax Details
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div className="min-w-0">
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Tax (%)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0%"
                      value={taxPercentage}
                      onChange={(e) => setTaxPercentage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 sm:p-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Fixed Tax ({symbol})
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={taxAmount}
                      onChange={(e) => setTaxAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 sm:p-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Tax Application
                  </label>
                  <select
                    value={taxApplication}
                    onChange={(e) => setTaxApplication(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="exclusive">
                      Exclusive (Added to amount)
                    </option>
                    <option value="inclusive">
                      Inclusive (Included in amount)
                    </option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 sm:py-2.5 rounded-lg text-xs sm:text-sm transition shadow-sm"
            >
              {editingTxId ? "Update Transaction" : "Add Transaction"}
            </button>
          </form>
        </div>

        {/* Expense Envelope Manager Form */}
        <div
          ref={envelopeFormRef}
          className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm w-full"
        >
          <h2 className="text-sm font-semibold tracking-wide text-slate-200 mb-4 truncate">
            {editingEnvId ? "Edit Expense Envelope" : "Create Expense Envelope"}
          </h2>
          <form onSubmit={handleCreateEnvelope} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Envelope Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rent, Groceries"
                value={envName}
                onChange={(e) => setEnvName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Allocated Amount ({symbol})
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={envAmount}
                onChange={(e) => setEnvAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium py-3 sm:py-2.5 rounded-lg text-xs sm:text-sm transition border border-slate-700"
            >
              {editingEnvId
                ? "Update Expense Envelope"
                : "Add Expense Envelope"}
            </button>
          </form>
        </div>

        {/* Income Envelope Manager Form */}
        <div
          ref={incomeFormRef}
          className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm w-full"
        >
          <h2 className="text-sm font-semibold tracking-wide text-slate-200 mb-4 truncate">
            {editingIncomeEnvId
              ? "Edit Income Envelope"
              : "Create Income Envelope"}
          </h2>
          <form onSubmit={handleCreateIncomeEnvelope} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Income Envelope Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Salary, Freelance"
                value={incomeEnvName}
                onChange={(e) => setIncomeEnvName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Initial Income Amount ({symbol})
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={incomeEnvAmount}
                onChange={(e) => setIncomeEnvAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-medium py-3 sm:py-2.5 rounded-lg text-xs sm:text-sm transition border border-emerald-700"
            >
              {editingIncomeEnvId
                ? "Update Income Envelope"
                : "Add Income Envelope"}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Envelopes, Income Envelopes, Transfer Controls & Transactions */}
      <div className="space-y-6 lg:col-span-2 w-full min-w-0">
        {/* Global Transfer Trigger Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-200">
              Envelope Fund Transfers
            </p>
            <p className="text-[11px] text-slate-400">
              Transfer partial or full amounts between envelopes seamlessly.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowTransferModal(true)}
            className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-semibold rounded-lg transition"
          >
            Transfer Funds
          </button>
        </div>

        {/* Transfer Modal / Drawer */}
        {showTransferModal && (
          <div className="bg-slate-950 border border-emerald-900/50 rounded-xl p-4 sm:p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Transfer Between Envelopes
              </h3>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>
            <form onSubmit={executeTransfer} className="space-y-3">
              <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTransferType("expense")}
                  className={`py-1.5 text-xs font-medium rounded transition ${
                    transferType === "expense"
                      ? "bg-slate-800 text-white shadow"
                      : "text-slate-400"
                  }`}
                >
                  Expense Envelopes
                </button>
                <button
                  type="button"
                  onClick={() => setTransferType("income")}
                  className={`py-1.5 text-xs font-medium rounded transition ${
                    transferType === "income"
                      ? "bg-slate-800 text-emerald-400 shadow"
                      : "text-slate-400"
                  }`}
                >
                  Income Envelopes
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    From Envelope
                  </label>
                  <select
                    required
                    value={fromEnvId}
                    onChange={(e) => setFromEnvId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100"
                  >
                    <option value="">Select Source</option>
                    {(transferType === "expense"
                      ? envelopes
                      : incomeEnvelopes
                    ).map((env) => (
                      <option key={env._id} value={env._id}>
                        {env.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    To Envelope
                  </label>
                  <select
                    required
                    value={toEnvId}
                    onChange={(e) => setToEnvId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100"
                  >
                    <option value="">Select Destination</option>
                    {(transferType === "expense" ? envelopes : incomeEnvelopes)
                      .filter((env) => env._id !== fromEnvId)
                      .map((env) => (
                        <option key={env._id} value={env._id}>
                          {env.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] text-slate-400">
                    Transfer Amount ({symbol})
                  </label>
                  {fromEnvId && (
                    <button
                      type="button"
                      onClick={handleMaxTransfer}
                      className="text-[10px] text-emerald-400 hover:underline font-semibold"
                    >
                      Transfer All (Max)
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-lg text-xs transition"
              >
                Confirm Transfer
              </button>
            </form>
          </div>
        )}

        {/* Budget Envelopes Summary Grid */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm w-full overflow-hidden">
          <h2 className="text-sm font-semibold tracking-wide text-slate-200 mb-4 truncate">
            Budget Envelopes (Expense)
          </h2>
          {envelopes.length === 0 ? (
            <p className="text-xs text-slate-500">
              No expense envelopes created yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {envelopes.map((env) => {
                const envelopeExpenses = transactions.filter(
                  (t) =>
                    t.type === "expense" &&
                    ((t.envelopeId && t.envelopeId._id === env._id) ||
                      t.envelopeId === env._id),
                );
                const consumed = envelopeExpenses.reduce(
                  (acc, t) => acc + Number(t.amount || 0),
                  0,
                );
                const isOpen = selectedEnvelopeId === env._id;

                return (
                  <div
                    key={env._id}
                    onClick={() =>
                      setSelectedEnvelopeId(isOpen ? null : env._id)
                    }
                    className={`bg-slate-950 border border-slate-800/80 p-3 sm:p-4 rounded-lg cursor-pointer transition min-w-0 ${
                      isOpen ? "ring-1 ring-emerald-500" : ""
                    }`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-semibold text-slate-200 truncate">
                          {env.name}
                        </p>
                        <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                          Allocated: {symbol}
                          {formatAmount(env.allocatedAmount)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateEnvelope(env._id);
                          }}
                          className="text-xs text-emerald-400 hover:underline px-1 py-0.5"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEnvelope(env._id);
                          }}
                          className="text-xs text-rose-400 hover:underline px-1 py-0.5"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300 space-y-2 min-w-0">
                        <p className="truncate">
                          <strong className="text-slate-400">Allocated:</strong>{" "}
                          {symbol}
                          {formatAmount(env.allocatedAmount)}
                        </p>
                        <p className="truncate">
                          <strong className="text-slate-400">Consumed:</strong>{" "}
                          {symbol}
                          {formatAmount(consumed)}
                        </p>
                        <p className="truncate">
                          <strong className="text-slate-400">Remaining:</strong>{" "}
                          {symbol}
                          {formatAmount((env.allocatedAmount || 0) - consumed)}
                        </p>

                        <div className="pt-2 min-w-0">
                          <p className="font-semibold text-slate-400 mb-2 truncate">
                            Expenses in this envelope:
                          </p>
                          {envelopeExpenses.length === 0 ? (
                            <p className="text-xs text-slate-500">
                              No expenses linked yet.
                            </p>
                          ) : (
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                              {envelopeExpenses.map((t) => (
                                <div
                                  key={t._id}
                                  className="flex justify-between items-center gap-2 min-w-0"
                                >
                                  <div className="min-w-0 flex-1 pr-2">
                                    <p className="text-xs font-medium text-slate-200 truncate">
                                      {t.title}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                      {t.date
                                        ? new Date(t.date).toLocaleDateString()
                                        : "-"}
                                    </p>
                                  </div>
                                  <div className="text-xs font-semibold text-rose-400 shrink-0">
                                    -{symbol}
                                    {formatAmount(t.amount)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Income Envelopes Summary Grid */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm w-full overflow-hidden">
          <h2 className="text-sm font-semibold tracking-wide text-slate-200 mb-4 truncate">
            Income Envelopes
          </h2>
          {incomeEnvelopes.length === 0 ? (
            <p className="text-xs text-slate-500">
              No income envelopes created yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {incomeEnvelopes.map((inc) => {
                const spentFromInc = transactions
                  .filter(
                    (t) =>
                      t.type === "expense" &&
                      (t.incomeSource?._id === inc._id ||
                        t.incomeSource === inc._id),
                  )
                  .reduce((acc, t) => acc + Number(t.amount || 0), 0);
                const remainingInc = inc.allocatedAmount - spentFromInc;
                const isOpen = selectedIncomeEnvId === inc._id;

                return (
                  <div
                    key={inc._id}
                    onClick={() =>
                      setSelectedIncomeEnvId(isOpen ? null : inc._id)
                    }
                    className={`bg-slate-950 border border-slate-800/80 p-3 sm:p-4 rounded-lg cursor-pointer transition min-w-0 ${
                      isOpen ? "ring-1 ring-emerald-500" : ""
                    }`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-semibold text-slate-200 truncate">
                          {inc.name}
                        </p>
                        <p className="text-[11px] sm:text-xs text-emerald-400 truncate">
                          Total: {symbol}
                          {formatAmount(inc.allocatedAmount)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateIncomeEnvelope(inc._id);
                          }}
                          className="text-xs text-emerald-400 hover:underline px-1 py-0.5"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteIncomeEnvelope(inc._id);
                          }}
                          className="text-xs text-rose-400 hover:underline px-1 py-0.5"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300 space-y-2 min-w-0">
                        <p className="truncate">
                          <strong className="text-slate-400">
                            Total Income:
                          </strong>{" "}
                          {symbol}
                          {formatAmount(inc.allocatedAmount)}
                        </p>
                        <p className="truncate">
                          <strong className="text-slate-400">
                            Spent from source:
                          </strong>{" "}
                          {symbol}
                          {formatAmount(spentFromInc)}
                        </p>
                        <p className="truncate">
                          <strong className="text-slate-400">
                            Remaining funds:
                          </strong>{" "}
                          {symbol}
                          {formatAmount(remainingInc)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Transactions History Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm w-full overflow-hidden">
          <h2 className="text-sm font-semibold tracking-wide text-slate-200 mb-4 truncate">
            Transaction History
          </h2>

          {transactions.length === 0 ? (
            <p className="text-xs text-slate-500">
              No transactions recorded for this period.
            </p>
          ) : (
            <div className="space-y-3 min-w-0">
              {transactions.map((tx) => {
                const isExpanded = expandedTxId === tx._id;
                return (
                  <div
                    key={tx._id}
                    className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 sm:p-4 space-y-3 w-full min-w-0 overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 min-w-0">
                      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        <span
                          className={`w-2.5 h-2.5 rounded-full mt-1 sm:mt-0 shrink-0 ${tx.type === "income" ? "bg-emerald-500" : "bg-rose-500"}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-semibold text-slate-200 truncate">
                            {tx.title}
                          </p>
                          <p className="text-[10px] sm:text-xs text-slate-400 truncate">
                            {tx.date
                              ? new Date(tx.date).toLocaleDateString()
                              : "Recent"}{" "}
                            •{" "}
                            <span className="uppercase">
                              {tx.paymentMethod || "cash"}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 pt-2 sm:pt-0 border-t border-slate-900 sm:border-0 shrink-0">
                        <span
                          className={`text-xs sm:text-sm font-bold shrink-0 ${tx.type === "income" ? "text-emerald-400" : "text-rose-400"}`}
                        >
                          {tx.type === "income" ? "+" : "-"}
                          {symbol}
                          {formatAmount(tx.amount)}
                        </span>

                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartEditTransaction(tx)}
                            className="text-xs text-emerald-400 hover:underline py-1 px-1"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(tx._id)}
                            className="text-xs text-rose-400 hover:underline py-1 px-1"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedTxId(isExpanded ? null : tx._id)
                            }
                            className="text-xs text-slate-400 hover:text-white py-1 px-1"
                          >
                            {isExpanded ? "Less" : "Details"}
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Expanded Details View */}
                    {isExpanded && (
                      <div className="pt-3 mt-2 border-t border-slate-800/80 text-xs text-slate-300 space-y-1.5 min-w-0 overflow-x-auto">
                        {tx.purpose && (
                          <p className="truncate">
                            <strong className="text-slate-400">Purpose:</strong>{" "}
                            {tx.purpose}
                          </p>
                        )}
                        {tx.envelopeId && (
                          <p className="truncate">
                            <strong className="text-slate-400">
                              Envelope:
                            </strong>{" "}
                            {typeof tx.envelopeId === "object"
                              ? tx.envelopeId.name
                              : "Linked"}
                          </p>
                        )}
                        {tx.incomeSource && (
                          <p className="truncate">
                            <strong className="text-slate-400">
                              {tx.type === "income"
                                ? "Income Envelope:"
                                : "Funded From:"}
                            </strong>{" "}
                            {(() => {
                              // 1. If it's already an object, grab its name/title/label
                              if (
                                typeof tx.incomeSource === "object" &&
                                tx.incomeSource !== null
                              ) {
                                return (
                                  tx.incomeSource.name ||
                                  tx.incomeSource.title ||
                                  tx.incomeSource.envelopeName ||
                                  "Linked Income"
                                );
                              }

                              // 2. If it's an ID string, search the incomeEnvelopes array safely
                              const foundEnv = incomeEnvelopes?.find(
                                (e) =>
                                  String(e._id) === String(tx.incomeSource),
                              );

                              return foundEnv ? foundEnv.name : "Linked Income";
                            })()}
                          </p>
                        )}
                        {(tx.taxAmount || tx.taxPercentage) && (
                          <p className="truncate">
                            <strong className="text-slate-400">Tax:</strong>{" "}
                            {tx.taxPercentage ? `${tx.taxPercentage}%` : ""}{" "}
                            {tx.taxAmount
                              ? `(${symbol}${formatAmount(tx.taxAmount)})`
                              : ""}{" "}
                            [{tx.taxApplication}]
                          </p>
                        )}
                        {tx.updateLogs && tx.updateLogs.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-800 min-w-0">
                            <p className="font-semibold text-slate-400 mb-1">
                              Update History ({tx.updateLogs.length}):
                            </p>
                            {tx.updateLogs.map((log, idx) => (
                              <p
                                key={idx}
                                className="text-[10px] sm:text-xs text-slate-400 truncate"
                              >
                                • {new Date(log.timestamp).toLocaleString()}:{" "}
                                {log.reason} (Before: {symbol}
                                {formatAmount(log.before)} → After: {symbol}
                                {formatAmount(log.after)})
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Maincontent;
