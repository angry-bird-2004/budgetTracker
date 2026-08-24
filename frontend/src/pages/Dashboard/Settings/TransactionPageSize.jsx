import React from "react";
import { TRANSACTION_PAGE_SIZE_OPTIONS } from "./constants";

const TransactionPageSize = ({
  value,
  onChange,
  onSave,
  isSaving,
  disabled,
  status,
  error,
}) => (
  <div className="space-y-4">
    <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">
      Rows per page
    </label>
    <div className="flex flex-wrap gap-2">
      {TRANSACTION_PAGE_SIZE_OPTIONS.map((size) => {
        const selected = Number(value) === size;
        return (
          <button
            key={size}
            type="button"
            onClick={() => onChange(size)}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              selected
                ? "border-emerald-500 bg-emerald-600 text-white shadow"
                : "border-slate-700 bg-slate-950 text-slate-300 hover:border-emerald-500/60 hover:text-white"
            }`}
          >
            {size}
          </button>
        );
      })}
    </div>
    <p className="text-xs text-slate-500">
      The transaction list and tab will load this many rows at a time.
    </p>
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={disabled || isSaving}
        onClick={onSave}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {isSaving ? "Saving..." : "Save"}
      </button>
      {status === "saved" && (
        <span className="text-xs font-medium text-emerald-400">
          Page size saved.
        </span>
      )}
      {error && (
        <span className="text-xs font-medium text-rose-400">{error}</span>
      )}
    </div>
  </div>
);

export default TransactionPageSize;
