export const PERIODS = [
  ["all", "All time"],
  ["today", "Today"],
  ["weekly", "Week"],
  ["monthly", "Month"],
  ["financial-year", "Financial year"],
  ["yearly", "Year"],
];

export const toBaseAmount = (value, currency, rate) => {
  const amount = Number(value);
  return currency === "USD" ? amount * rate : amount;
};

export const fromBaseAmount = (value, currency, rate) => {
  const amount = Number(value) || 0;
  return currency === "USD" ? amount / (Number(rate) || 1) : amount;
};

export const formatMoney = (value, currency, rate) => {
  const amount = fromBaseAmount(value, currency, rate);
  const symbol = currency === "USD" ? "$" : "Rs ";
  return `${symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const toDateInput = (date) => {
  const value = date ? new Date(date) : new Date();
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

export const fromDateInput = (date) => {
  if (!date) return new Date().toISOString();
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day, 12).toISOString();
};

export const toCsv = (rows, transfers = []) => {
  const headers = [
    "Id",
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
  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const transactionRows = rows.map((tx) => [
    tx._id,
    tx.date ? toDateInput(tx.date) : "",
    tx.type,
    tx.title,
    tx.type === "income" ? tx.amount : -Math.abs(Number(tx.amount) || 0),
    "PKR",
    tx.paymentMethod || "cash",
    typeof tx.envelopeId === "object" ? tx.envelopeId?.name : "",
    typeof tx.incomeSource === "object"
      ? tx.incomeSource?.name
      : tx.incomeSource,
    tx.purpose,
  ]);
  const transferRows = transfers.flatMap((transfer) => {
    const source = transfer.fromName;
    const destination = transfer.toName;
    const date = transfer.date ? toDateInput(transfer.date) : "";
    const amount = Math.abs(Number(transfer.amount) || 0);
    return [
      [
        `${transfer._id || ""}-from`,
        date,
        "transfer-out",
        `Transfer: ${source || "Source"} → ${destination || "Destination"}`,
        -amount,
        "PKR",
        "transfer",
        transfer.type === "expense" ? source : "",
        transfer.type === "income" ? source : "",
        transfer.purpose || "Envelope Transfer Out",
      ],
      [
        `${transfer._id || ""}-to`,
        date,
        "transfer-in",
        `Transfer: ${source || "Source"} → ${destination || "Destination"}`,
        amount,
        "PKR",
        "transfer",
        transfer.type === "expense" ? destination : "",
        transfer.type === "income" ? destination : "",
        transfer.purpose || "Envelope Transfer In",
      ],
    ];
  });
  return [
    headers.map(escape).join(","),
    ...[...transactionRows, ...transferRows].map((row) => row.map(escape).join(",")),
  ].join("\n");
};
