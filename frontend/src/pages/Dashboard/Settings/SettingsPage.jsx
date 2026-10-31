import React, { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";
import SettingsHeader from "./SettingsHeader";
import SettingsCard from "./SettingsCard";
import TransactionPageSize from "./TransactionPageSize";
import { fetchSettings, updateSettings } from "../../../services/api";
import { DEFAULT_TRANSACTION_PAGE_SIZE } from "./constants";

const SettingsPage = () => {
  const [transactionPageSize, setTransactionPageSize] = useState(
    DEFAULT_TRANSACTION_PAGE_SIZE,
  );
  const [savedPageSize, setSavedPageSize] = useState(
    DEFAULT_TRANSACTION_PAGE_SIZE,
  );
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetchSettings();
        if (cancelled) return;
        const size = Number(res.data?.transactionPageSize);
        const nextSize = Number.isFinite(size) && size >= 1
          ? size
          : DEFAULT_TRANSACTION_PAGE_SIZE;
        setTransactionPageSize(nextSize);
        setSavedPageSize(nextSize);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Failed to load settings.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setError("");
    setStatus("");

    try {
      const res = await updateSettings({ transactionPageSize });
      const size = Number(res.data?.transactionPageSize);
      const nextSize = Number.isFinite(size) && size >= 1
        ? size
        : transactionPageSize;
      setTransactionPageSize(nextSize);
      setSavedPageSize(nextSize);
      setStatus("saved");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950/80 px-3 py-6 text-slate-100 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <Navbar />
        <SettingsHeader />

        <SettingsCard
          eyebrow="Mobile app"
          title="Use Budget Tracker on Android"
          description="Download the latest APK and install it on your Android phone or tablet."
        >
          <a
            href="https://github.com/angry-bird-2004/budgetTracker/releases/latest/download/budget-tracker.apk"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
            aria-label="Download Budget Tracker for Android"
          >
            Download Android app (.apk)
          </a>
          <p className="mt-3 text-xs text-slate-500">
            Android may ask you to allow app installs from your browser.
          </p>
        </SettingsCard>

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
            Loading settings...
          </div>
        ) : (
          <SettingsCard
            title="Transaction list page size"
            description="Choose how many transactions appear on each page of the history list."
          >
            <TransactionPageSize
              value={transactionPageSize}
              onChange={(size) => {
                setTransactionPageSize(size);
                setStatus("");
                setError("");
              }}
              onSave={handleSave}
              isSaving={isSaving}
              disabled={transactionPageSize === savedPageSize}
              status={status}
              error={error}
            />
          </SettingsCard>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
