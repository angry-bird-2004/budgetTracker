import React, { useRef, useState } from "react";
import { toLocalDateInput, fromLocalDateInput } from "../../../../utils/dates";

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
  handleExportTransactions,
  isSubmitting,
  transactionSearch,
  setTransactionSearch,
  transactionTypeFilter,
  setTransactionTypeFilter,
  transactionSort,
  setTransactionSort,
  loadTransactions,
  txPage = 1,
  txPages = 1,
  txTotal = 0,
  transactionsLoading,
}) => {
  const fileInputRef = useRef(null);
  const [exporting, setExporting] = useState(false);

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

  const exportTransactionsCSV = (rows) => {
    const exportRows = (rows || []).map((tx) => ({
      Date: tx.date ? toLocalDateInput(tx.date) : "",
      Type: tx.type,
      Title: tx.title,
      Amount: tx.amount,
      Currency: "PKR",
      PaymentMethod: tx.paymentMethod || "cash",
      Envelope:
        typeof tx.envelopeId === "object" ? tx.envelopeId?.name || "" : "",
      IncomeSource:
        typeof tx.incomeSource === "object"
          ? tx.incomeSource?.name || ""
          : tx.incomeSource || "",
      Purpose: tx.purpose || "",
    }));

    const headers = [
      "Date",
      "Type",
      "Title",
      "Amount",
      "Currency",
      "PaymentMethod",
      "Envelope",
      "IncomeSource",
      "Purpose",
    ];
    const csv = [
      headers,
      ...exportRows.map((row) =>
        headers.map((key) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`),
      ),
    ]
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

      const headers = parseCSVLine(lines[0]).map((header) =>
        header.trim().toLowerCase(),
      );
      const importedRows = [];

      for (let i = 1; i < lines.length; i += 1) {
        const values = parseCSVLine(lines[i]);
        const row = Object.fromEntries(
          headers.map((header, index) => [header, values[index] ?? ""]),
        );

        const type = String(row.type || row.Type || "")
          .trim()
          .toLowerCase();
        if (!["income", "expense"].includes(type)) continue;

        const rawAmount = Number(
          String(row.amount ?? row.Amount ?? "").replace(/[^0-9.-]/g, ""),
        );
        if (!Number.isFinite(rawAmount) || rawAmount <= 0) continue;

        const currencyCode = String(row.currency || row.Currency || "PKR")
          .trim()
          .toUpperCase();
        if (currencyCode && currencyCode !== "PKR") continue;

        const title = String(
          row.title || row.Title || row.purpose || row.Purpose || "Imported",
        ).trim();
        const paymentMethod =
          String(row.paymentmethod || row.PaymentMethod || "cash")
            .trim()
            .toLowerCase() || "cash";
        const purpose = String(row.purpose || row.Purpose || "").trim();
        const dateValue = String(row.date || row.Date || "").trim();
        const normalizedDate = dateValue
          ? fromLocalDateInput(dateValue)
          : new Date();

        const payload = {
          title,
          amount: rawAmount,
          type,
          paymentMethod,
          purpose,
          date: normalizedDate,
        };

        if (type === "expense") {
          const envelopeName = String(
            row.envelope || row.Envelope || "",
          ).trim();
          const targetEnvelope = envelopeName
            ? envelopes.find(
                (env) => env.name.toLowerCase() === envelopeName.toLowerCase(),
              )
            : null;
          if (targetEnvelope) payload.envelopeId = targetEnvelope._id;

          const incomeName = String(
            row.incomesource || row.IncomeSource || "",
          ).trim();
          const matchedIncome = incomeName
            ? incomeEnvelopes.find(
                (env) => env.name.toLowerCase() === incomeName.toLowerCase(),
              )
            : null;
          if (matchedIncome) payload.incomeSource = matchedIncome._id;
        } else if (type === "income") {
          const incomeName = String(
            row.incomesource ||
              row.IncomeSource ||
              row.envelope ||
              row.Envelope ||
              "",
          ).trim();
          const matchedIncome = incomeName
            ? incomeEnvelopes.find(
                (env) => env.name.toLowerCase() === incomeName.toLowerCase(),
              )
            : null;
          if (matchedIncome) payload.incomeSource = matchedIncome._id;
        }

        importedRows.push(payload);
      }

      if (!importedRows.length) {
        alert("No valid transaction rows found in CSV.");
        event.target.value = "";
        return;
      }

      await handleImportTransactions(importedRows);
      event.target.value = "";
    } catch (error) {
      console.error("CSV import failed:", error);
      alert("CSV import failed.");
      event.target.value = "";
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm w-full overflow-hidden">
      <div className="flex flex-col gap-3 mb-4">
        {transactionsLoading && (
          <div className="text-xs text-slate-400">Loading transactions...</div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-slate-200 truncate">
            Transaction History ({txTotal})
          </h2>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-50 transition"
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
              disabled={isSubmitting || exporting}
              onClick={async () => {
                if (exporting) return;
                setExporting(true);
                try {
                  const rows = handleExportTransactions
                    ? await handleExportTransactions()
                    : transactions;
                  if (!rows?.length) {
                    alert("No transactions to export.");
                    return;
                  }
                  exportTransactionsCSV(rows);
                } catch (error) {
                  console.error("CSV export failed:", error);
                  alert("CSV export failed.");
                } finally {
                  setExporting(false);
                }
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50 transition"
            >
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <input
            type="text"
            value={transactionSearch}
            onChange={(e) => setTransactionSearch(e.target.value)}
            placeholder="Search title, purpose, or payment method..."
            className="w-full sm:flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
          <select
            value={transactionTypeFilter}
            onChange={(e) => setTransactionTypeFilter(e.target.value)}
            className="w-full sm:w-40 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select
            value={transactionSort}
            onChange={(e) => setTransactionSort(e.target.value)}
            className="w-full sm:w-40 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-5 text-center">
          <p className="text-sm font-medium text-slate-200">
            No matching transactions found
          </p>
        </div>
      ) : (
        <div className="space-y-3 min-w-0">
          {transactions.map((tx) => {
            const isExpanded = expandedTxId === tx._id;
            return (
              <div
                key={tx._id}
                className="bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 sm:p-4 space-y-2.5 w-full min-w-0 transition hover:border-emerald-500/30"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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

                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                    <span
                      className={`text-xs sm:text-sm font-bold ${
                        tx.type === "income"
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {symbol}
                      {formatAmount(tx.amount)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleStartEditTransaction(tx)}
                        className="text-[11px] text-emerald-400 hover:underline px-1 py-1 disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleDeleteTransaction(tx._id)}
                        className="text-[11px] text-rose-400 hover:underline px-1 py-1 disabled:opacity-50"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedTxId(isExpanded ? null : tx._id)
                        }
                        className="text-[11px] text-slate-400 hover:text-white px-1 py-1"
                      >
                        {isExpanded ? "Less" : "Details"}
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="pt-3 mt-2 border-t border-slate-800/80 text-xs text-slate-300 space-y-1.5 min-w-0">
                    {tx.purpose && (
                      <p>
                        <strong className="text-slate-400">Purpose:</strong>{" "}
                        {tx.purpose}
                      </p>
                    )}
                    {tx.envelopeId && (
                      <p>
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
                            (e) => String(e._id) === String(sourceRef),
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

          {txPages > 1 && (
            <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Page{" "}
                <span className="font-semibold text-slate-200">
                  {txPage}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-200">
                  {txPages}
                </span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={txPage <= 1 || transactionsLoading}
                  onClick={() => loadTransactions?.(txPage - 1, false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 bg-slate-950 text-slate-200 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={txPage >= txPages || transactionsLoading}
                  onClick={() => loadTransactions?.(txPage + 1, false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 bg-slate-950 text-slate-200 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
