import assert from "node:assert/strict";
import test from "node:test";
import {
  formatMoney,
  fromBaseAmount,
  fromDateInput,
  toBaseAmount,
  toDateInput,
  toCsv,
} from "./format.js";

test("currency conversion retains PKR as the stored base amount", () => {
  assert.equal(toBaseAmount(10, "USD", 280), 2800);
  assert.equal(fromBaseAmount(2800, "USD", 280), 10);
  assert.equal(formatMoney(2800, "PKR", 280), "Rs 2,800.00");
});

test("date-only values are converted to a stable midday timestamp", () => {
  assert.equal(toDateInput(fromDateInput("2026-10-29")), "2026-10-29");
});

test("CSV export escapes transaction content and includes both transfer sides", () => {
  const csv = toCsv(
    [{ _id: "tx1", date: "2026-10-29T00:00:00.000Z", type: "expense", title: 'Food, "market"', amount: 12, paymentMethod: "cash" }],
    [{ _id: "tr1", date: "2026-10-29T00:00:00.000Z", type: "expense", fromName: "Food", toName: "Travel", amount: 5 }],
  );
  assert.match(csv, /"Food, ""market"""/);
  assert.match(csv, /"transfer-out"/);
  assert.match(csv, /"transfer-in"/);
});
