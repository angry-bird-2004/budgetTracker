import React, { useRef } from "react";

const TransactionHistory = ({
  transactions,
  envelopes = [],
  incomeEnvelopes = [],
  expandedTxId,
  setExpandedTxId,
  symbol,
  formatAmount,
  handleStartEditTransaction,
  handleDeleteTransaction,
  handleImportTransactions,
  isSubmitting,
  transactionSearch,
  setTransactionSearch,
  transactionTypeFilter,
  setTransactionTypeFilter,
  transactionSort,
  setTransactionSort,
}) => {
  const fileInputRef = useRef(null);

  const parseCSVLine = (line) => {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    values.push(current);
    return values.map((value) => value.trim());
  };

  const filteredTransactions = transactions
    .filter((tx) => {
    const matchesType =
      transactionTypeFilter === "all" || tx.type === transactionTypeFilter;

    const searchText = transactionSearch.trim().toLowerCase();
    const haystack = [
      tx.title,
      tx.purpose,
      tx.paymentMethod,
      tx.type,
      tx.envelopeId?.name,
      tx.incomeSource?.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !searchText || haystack.includes(searchText);

      return matchesType && matchesSearch;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return transactionSort === "oldest" ? dateA - dateB : dateB - dateA;
    });

  const exportTransactionsCSV = () => {
    const rows = filteredTransactions.map((tx) => ({
      Date: tx.date ? new Date(tx.date).toISOString().split("T")[0] : "",
      Type: tx.type,
      Title: tx.title,
      Amount: `${symbol}${formatAmount(tx.amount)}`,
      PaymentMethod: tx.paymentMethod || "cash",
      Envelope: typeof tx.envelopeId === "object" ? tx.envelopeId?.name || "" : "",
      IncomeSource:
        typeof tx.incomeSource === "object"
          ? tx.incomeSource?.name || ""
          : tx.incomeSource || "",
      Purpose: tx.purpose || "",
    }));

    const headers = ["Date", "Type", "Title", "Amount", "PaymentMethod", "Envelope", "IncomeSource", "Purpose"];
    const csv = [headers, ...rows.map((row) => headers.map((key) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`))]
      .map((line) => line.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `budget-transactions-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importTransactionsCSV = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim());
      if (lines.length < 2) {
        alert("The CSV file is empty or missing data.");
        event.target.value = "";
        return;
      }

      const headers = parseCSVLine(lines[0]).map((header) => header.trim().toLowerCase());
      const rows = lines.slice(1).map((line) => {
        const values = parseCSVLine(line);
        return Object.fromEntries(
          headers.map((header, index) => [header, values[index] ?? ""]),
        );
      });

      const importedRows = rows
        .map((row) => {
          const type = String(row.type || row.Type || "").trim().toLowerCase();
          if (!['income', 'expense'].includes(type)) {
            return null;
          }

          const rawAmount = Number(String(row.amount ?? row.Amount ?? "").replace(/[^0-9.-]/g, ""));
          if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
            return null;
          }

          const title = String(row.title || row.Title || row.purpose || row.Purpose || (type === "income" ? "Imported income" : "Imported expense")).trim();
          const paymentMethod = String(row.paymentmethod || row.PaymentMethod || "cash").trim().toLowerCase() || "cash";
          const purpose = String(row.purpose || row.Purpose || "").trim();
          const dateValue = row.date || row.Date || new Date().toISOString();
          const date = new Date(dateValue);
          const normalizedDate = Number.isNaN(date.getTime()) ? new Date() : date;

          const payload = {
            title,
            amount: rawAmount,
            type,
            paymentMethod,
            purpose,
            date: normalizedDate,
          };

          if (type === "expense") {
            const envelopeName = String(row.envelope || row.Envelope || "").trim();
            const targetEnvelope = envelopeName
              ? envelopes.find((env) => env.name.toLowerCase() === envelopeName.toLowerCase())
              : null;
            if (targetEnvelope) {
              payload.envelopeId = targetEnvelope._id;
            }

            const incomeName = String(row.incomesource || row.IncomeSource || "").trim();
            const matchedIncome = incomeName
              ? incomeEnvelopes.find((env) => env.name.toLowerCase() === incomeName.toLowerCase())
              : null;
            if (matchedIncome) {
              payload.incomeSource = matchedIncome._id;
            }
          } else if (type === "income") {
            const incomeName = String(row.incomesource || row.IncomeSource || row.envelope || row.Envelope || "").trim();
            const matchedIncome = incomeName
              ? incomeEnvelopes.find((env) => env.name.toLowerCase() === incomeName.toLowerCase())
              : null;
            if (matchedIncome) {
              payload.incomeSource = matchedIncome._id;
            }
          }

          return payload;
        })
        .filter(Boolean);

      if (!importedRows.length) {
        alert("No valid transaction rows were found in the CSV file.");
        event.target.value = "";
        return;
      }

      await handleImportTransactions(importedRows);
      event.target.value = "";
    } catch (error) {
      console.error("CSV import failed:", error);
      alert("CSV import failed. Please check the file format and try again.");
      event.target.value = "";
    }
  };

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm w-full overflow-hidden">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-wide text-slate-200 truncate">
              Transaction History
            </h2>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
              >
                Import CSV
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={importTransactionsCSV}
              />
              <button
                type="button"
                disabled={isSubmitting}
                onClick={exportTransactionsCSV}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
              >
                Export CSV
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <input
              type="text"
              value={transactionSearch}
              onChange={(e) => setTransactionSearch(e.target.value)}
              placeholder="Search title, purpose, or source..."
              className="w-full sm:flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition duration-200 focus:shadow-[0_0_0_1px_rgba(16,185,129,0.35)]"
            />

            <select
              value={transactionTypeFilter}
              onChange={(e) => setTransactionTypeFilter(e.target.value)}
              className="w-full sm:w-40 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition duration-200"
            >
              <option value="all">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>

            <select
              value={transactionSort}
              onChange={(e) => setTransactionSort(e.target.value)}
              className="w-full sm:w-40 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition duration-200"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-5 text-center">
            <p className="text-sm font-medium text-slate-200">
              {transactions.length === 0
                ? "No transactions recorded yet"
                : "No matching transactions found"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {transactions.length === 0
                ? "Add your first income or expense to start tracking your budget."
                : "Try clearing the search or changing the filter to see more results."}
            </p>
          </div>
        ) : (
          <div className="space-y-3 min-w-0">
            {filteredTransactions.map((tx) => {
              const isExpanded = expandedTxId === tx._id;
              return (
                <div
                  key={tx._id}
                  className="bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 sm:p-4 space-y-2.5 sm:space-y-3 w-full min-w-0 overflow-hidden transition-all duration-200 hover:border-emerald-500/30 hover:shadow-[0_12px_22px_rgba(15,23,42,0.28)] hover:shadow-emerald-950/10"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 min-w-0">
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      <span
                        className={`w-2.5 h-2.5 rounded-full mt-1 sm:mt-0 shrink-0 ${
                          tx.type === "income" ? "bg-emerald-500" : "bg-rose-500"
                        }`}
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
                        className={`text-xs sm:text-sm font-bold shrink-0 ${
                          tx.type === "income"
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}
                        {symbol}
                        {formatAmount(tx.amount)}
                      </span>

                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleStartEditTransaction(tx)}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline py-1 px-1 rounded transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleDeleteTransaction(tx._id)}
                          className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline py-1 px-1 rounded transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedTxId(isExpanded ? null : tx._id)
                          }
                          className="text-[11px] text-slate-400 hover:text-white py-1 px-1 rounded transition"
                        >
                          {isExpanded ? "Less" : "Details"}
                        </button>
                      </div>
                    </div>
                  </div>

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
                          <strong className="text-slate-400">Envelope:</strong>{" "}
                          {typeof tx.envelopeId === "object"
                            ? tx.envelopeId.name
                            : "Linked"}
                        </p>
                      )}
                      {(tx.incomeSource || tx.txIncomeEnvelope) && (
                        <p className="truncate">
                          <strong className="text-slate-400">
                            {tx.type === "income"
                              ? "Income Envelope:"
                              : "Funded From:"}
                          </strong>{" "}
                          {(() => {
                            const sourceRef =
                              tx.incomeSource || tx.txIncomeEnvelope;

                            if (
                              typeof sourceRef === "object" &&
                              sourceRef !== null
                            ) {
                              return (
                                sourceRef.name ||
                                sourceRef.title ||
                                sourceRef.envelopeName ||
                                "Linked Income"
                              );
                            }

                            const foundEnv = incomeEnvelopes?.find(
                              (e) => String(e._id) === String(sourceRef)
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
    </>
  );
};

export default TransactionHistory;