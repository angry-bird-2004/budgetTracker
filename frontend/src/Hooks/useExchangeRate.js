import { useState, useEffect } from "react";

// Fallback PKR rate in case API call fails or user is offline
const FALLBACK_RATE = 278.0; 
const CACHE_KEY = "usd_pkr_exchange_rate";
const CACHE_TIME_KEY = "usd_pkr_rate_timestamp";
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours cache duration

export const useExchangeRate = () => {
  const [conversionRate, setConversionRate] = useState(() => {
    // Check local storage for existing cached rate immediately during state initialization
    const cachedRate = localStorage.getItem(CACHE_KEY);
    return cachedRate ? parseFloat(cachedRate) : FALLBACK_RATE;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLiveRate = async () => {
      const cachedRate = localStorage.getItem(CACHE_KEY);
      const cachedTimestamp = localStorage.getItem(CACHE_TIME_KEY);
      const now = Date.now();

      // If cached rate exists and is less than 12 hours old, use cached value
      if (
        cachedRate &&
        cachedTimestamp &&
        now - parseInt(cachedTimestamp, 10) < CACHE_DURATION
      ) {
        setConversionRate(parseFloat(cachedRate));
        setLoading(false);
        return;
      }

      try {
        // Free open access endpoint - No API key needed
        const response = await fetch("https://open.er-api.com/v6/latest/USD");
        if (!response.ok) {
          throw new Error(`Exchange rate API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (data && data.rates && data.rates.PKR) {
          const livePkrRate = data.rates.PKR;
          setConversionRate(livePkrRate);

          // Update cache with fresh rates
          localStorage.setItem(CACHE_KEY, livePkrRate.toString());
          localStorage.setItem(CACHE_TIME_KEY, now.toString());
        }
      } catch (err) {
        console.warn("Failed to fetch live exchange rate, utilizing fallback/cache:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveRate();
  }, []);

  return { conversionRate, loading, error };
};