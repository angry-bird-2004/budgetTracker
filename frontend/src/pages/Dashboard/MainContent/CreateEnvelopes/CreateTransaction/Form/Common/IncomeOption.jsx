import React from "react";

const IncomeOption = ({
  incomeEnvelopes,
  symbol,
  formatAmount,
}) => {
  return (
    <>
      {incomeEnvelopes.map((inc) => {
        const remainingForThisEnv =
          inc.currentBalance != null
            ? Number(inc.currentBalance)
            : Number(inc.allocatedAmount || 0) - Number(inc.consumed || 0);

        return (
          <option key={inc._id} value={inc._id}>
            {inc.name} (Rem: {symbol}
            {formatAmount(remainingForThisEnv)})
          </option>
        );
      })}
    </>
  );
};

export default IncomeOption;
