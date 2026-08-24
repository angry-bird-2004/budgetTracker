import React from "react";

const IncomeOption = ({
  incomeEnvelopes,
  transactions,
  symbol,
  formatAmount,
}) => {
  return (
    <>
      {incomeEnvelopes.map((inc) => {
        const spentForThisEnv = transactions
          .filter((t) => {
            if (t.type !== "expense") return false;
            const sourceRef = t.incomeSource || t.txIncomeEnvelope;
            const sourceId =
              typeof sourceRef === "object" && sourceRef !== null
                ? sourceRef._id
                : sourceRef;
            return String(sourceId) === String(inc._id);
          })
          .reduce((acc, t) => acc + Number(t.amount || 0), 0);

        const remainingForThisEnv =
          Number(inc.allocatedAmount || 0) - spentForThisEnv;

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
