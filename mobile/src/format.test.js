import assert from "node:assert/strict";
import test from "node:test";
import {
  formatMoney,
  fromBaseAmount,
  fromDateInput,
  getEditableTransactionAmount,
  isValidDateInput,
  parseCsv,
  toBaseAmount,
  toDateInput,
  toCsv,
} from "./format.js";

test("currency conversion retains PKR as the stored base amount", () => {
  assert.equal(toBaseAmount(10, "USD", 280), 2800);
  assert.equal(fromBaseAmount(2800, "USD", 280), 10);
  assert.equal(formatMoney(2800, "PKR", 280), "Rs 2,800.00");
});

test("editing an exclusive-tax expense excludes tax from the editable base amount", () => {
  assert.equal(
    getEditableTransactionAmount({
      amount: 105,
      taxAmount: 5,
      taxApplication: "exclusive",
      type: "expense",
    }),
    100,
  );
  assert.equal(
    getEditableTransactionAmount({
      amount: 105,
      taxAmount: 5,
      taxApplication: "inclusive",
      type: "expense",
    }),
    105,
  );
});

test("date-only values are converted to a stable midday timestamp", () => {
  assert.equal(toDateInput(fromDateInput("2026-10-29")), "2026-10-29");
  assert.equal(isValidDateInput("2026-10-29"), true);
  assert.equal(isValidDateInput("2026-02-29"), false);
  assert.equal(isValidDateInput("not-a-date"), false);
});

test("CSV export escapes transaction content and includes both transfer sides", () => {
  const csv = toCsv(
    [{ _id: "tx1", date: "2026-10-29T00:00:00.000Z", type: "expense", title: 'Food, "market"', amount: 12, taxPercentage: 5, taxAmount: 0.6, taxApplication: "inclusive", paymentMethod: "cash" }],
    [{ _id: "tr1", date: "2026-10-29T00:00:00.000Z", type: "expense", fromName: "Food", toName: "Travel", amount: 5 }],
  );
  assert.match(csv, /"Food, ""market"""/);
  assert.match(csv, /"5","0.6","inclusive"/);
  assert.match(csv, /"transfer-out"/);
  assert.match(csv, /"transfer-in"/);
});

test("CSV parsing preserves commas, escaped quotes, and embedded newlines", () => {
  assert.deepEqual(
    parseCsv('"Title","Purpose"\r\n"Coffee, beans","said ""hello""\nand left"\r\n'),
    [["Title", "Purpose"], ["Coffee, beans", 'said "hello"\nand left']],
  );
  assert.throws(() => parseCsv('"unclosed'), /unclosed quoted field/);
});
