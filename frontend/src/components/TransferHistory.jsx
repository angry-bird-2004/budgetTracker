import React, { useState } from "react";
import { getPeriodRangeLabel } from "../utils/period";

const TransferHistory = ({
  transfers = [],
  envelopes = [],
  incomeEnvelopes = [],
  symbol,
  formatAmount,
  transfersLoading = false,
  period = "all",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // 'all', 'expense', 'income'
  const periodLabel = getPeriodRangeLabel(period);

  const filteredTransfers = (transfers || []).filter((transfer) => {
    const matchesType = typeFilter === "all" || transfer.type === typeFilter;
    
    const sourceList = transfer.type === "expense" ? envelopes : incomeEnvelopes;
    const fromEnv = sourceList.find((e) => String(e._id) === String(transfer.fromEnvelopeId || transfer.fromId));
    const toEnv = sourceList.find((e) => String(e._id) === String(transfer.toEnvelopeId || transfer.toId));
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      fromEnv?.name?.toLowerCase().includes(searchLower) ||
      toEnv?.name?.toLowerCase().includes(searchLower) ||
      transfer.purpose?.toLowerCase().includes(searchLower);

    return matchesType && matchesSearch;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm w-full overflow-hidden">
      <div className="flex flex-col gap-3 mb-4">
        {transfersLoading && (
          <div className="mb-1">
            <div className="inline-flex items-center gap-2 text-xs text-slate-400">
              <div className="h-3 w-3 rounded-full animate-spin border-2 border-emerald-400/30 border-t-emerald-400" />
              Loading transfer history...
            </div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-wide text-slate-200 truncate">
              Envelope Transfer History ({filteredTransfers.length})
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Track fund movements between your envelopes · {periodLabel}
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by envelope name or purpose..."
            className="w-full sm:flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-44 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="all">All Transfer Pools</option>
            <option value="expense">Expense Envelopes</option>
            <option value="income">Income Envelopes</option>
          </select>
        </div>
      </div>

      {filteredTransfers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-5 text-center">
          <p className="text-sm font-medium text-slate-200">
            No transfer records found
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Transfers made between envelopes for {periodLabel} will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3 min-w-0">
          {filteredTransfers.map((tx) => {
            const sourceList = tx.type === "expense" ? envelopes : incomeEnvelopes;
            const fromEnv = sourceList.find((e) => String(e._id) === String(tx.fromEnvelopeId || tx.fromId));
            const toEnv = sourceList.find((e) => String(e._id) === String(tx.toEnvelopeId || tx.toId));

            return (
              <div
                key={tx._id || Math.random()}
                className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition hover:border-emerald-500/30 min-w-0"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-bold text-xs">
                    ⇄
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="text-xs sm:text-sm font-semibold text-slate-200 truncate max-w-[140px]">
                        {fromEnv?.name || tx.fromName || "Unknown Source"}
                      </span>
                      <span className="text-slate-500 text-xs shrink-0">➔</span>
                      <span className="text-xs sm:text-sm font-semibold text-emerald-400 truncate max-w-[140px]">
                        {toEnv?.name || tx.toName || "Unknown Destination"}
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                      {tx.date ? new Date(tx.date).toLocaleString() : "Recently"} •{" "}
                      <span className="uppercase text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-300 border border-slate-800">
                        {tx.type} pool
                      </span>
                      {tx.purpose && ` • ${tx.purpose}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                  <span className="text-xs sm:text-sm font-bold text-emerald-400">
                    +{symbol}
                    {formatAmount(tx.amount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default React.memo(TransferHistory);