import React, { useCallback, useMemo, useState } from "react";
import { PeriodContext } from "./periodContext";
import {
  getPeriodRangeLabel,
  isValidPeriod,
  readStoredPeriod,
  writeStoredPeriod,
} from "../utils/period";

export { PeriodContext };

export const PeriodProvider = ({ children }) => {
  const [period, setPeriodState] = useState(readStoredPeriod);

  const setPeriod = useCallback((nextPeriod) => {
    if (!isValidPeriod(nextPeriod)) return;
    setPeriodState(nextPeriod);
    writeStoredPeriod(nextPeriod);
  }, []);

  const value = useMemo(
    () => ({
      period,
      setPeriod,
      periodLabel: getPeriodRangeLabel(period),
    }),
    [period, setPeriod],
  );

  return (
    <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>
  );
};
