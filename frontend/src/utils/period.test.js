import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_PERIOD,
  PERIOD_STORAGE_KEY,
  getPeriodRangeLabel,
  isValidPeriod,
  readStoredPeriod,
  writeStoredPeriod,
} from "./period.js";

test("weekly and today are valid periods", () => {
  assert.equal(isValidPeriod("today"), true);
  assert.equal(isValidPeriod("weekly"), true);
  assert.equal(isValidPeriod("monthly"), true);
  assert.equal(isValidPeriod("nope"), false);
});

test("readStoredPeriod keeps a saved weekly range", () => {
  const storage = {
    getItem: (key) => (key === PERIOD_STORAGE_KEY ? "weekly" : null),
  };
  assert.equal(readStoredPeriod(storage), "weekly");
});

test("readStoredPeriod falls back for invalid values", () => {
  const storage = { getItem: () => "nope" };
  assert.equal(readStoredPeriod(storage), DEFAULT_PERIOD);
});

test("writeStoredPeriod persists monthly", () => {
  const saved = {};
  const storage = {
    setItem: (key, value) => {
      saved[key] = value;
    },
  };
  assert.equal(writeStoredPeriod("monthly", storage), true);
  assert.equal(saved[PERIOD_STORAGE_KEY], "monthly");
});

test("period range labels describe the current window", () => {
  assert.equal(getPeriodRangeLabel("today"), "today");
  assert.equal(getPeriodRangeLabel("weekly"), "this week");
  assert.equal(getPeriodRangeLabel("monthly"), "this month");
});
