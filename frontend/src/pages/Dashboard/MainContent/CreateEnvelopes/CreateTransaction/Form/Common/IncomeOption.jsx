import React from "react";

const IncomeOption = ({
  incomeEnvelopes = [],
  symbol,
  formatAmount,
}) => {
  const list = Array.isArray(incomeEnvelopes) ? incomeEnvelopes : [];

  return list.map((inc) => {
    const remainingForThisEnv =
      inc.currentBalance != null
        ? Number(inc.currentBalance)
        : Number(inc.allocatedAmount || 0) - Number(inc.consumed || 0);

    return (
      <option key={String(inc._id)} value={String(inc._id)}>
        {inc.name} (Bal: {symbol}
        {typeof formatAmount === "function"
          ? formatAmount(remainingForThisEnv)
          : remainingForThisEnv}
        )
      </option>
    );
  });
};

export default IncomeOption;
