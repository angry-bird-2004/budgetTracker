const parseYear = (year, fallback) => {
  const parsed = parseInt(year, 10);
  return Number.isInteger(parsed) && parsed >= 1970 && parsed <= 9999
    ? parsed
    : fallback;
};

const parseMonthIndex = (month, fallback) => {
  const parsed = parseInt(month, 10);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 12
    ? parsed - 1
    : fallback;
};

const getPeriodRange = ({ period, year, month, tzOffset } = {}) => {
  const offsetMinutes = Number(tzOffset);
  const hasOffset = Number.isFinite(offsetMinutes);
  const offsetMs = hasOffset ? offsetMinutes * 60 * 1000 : 0;
  const localNow = hasOffset ? new Date(Date.now() - offsetMs) : new Date();

  const fallbackYear = hasOffset
    ? localNow.getUTCFullYear()
    : localNow.getFullYear();
  const fallbackMonth = hasOffset
    ? localNow.getUTCMonth()
    : localNow.getMonth();

  const y = parseYear(year, fallbackYear);
  const m = parseMonthIndex(month, fallbackMonth);
  const d = hasOffset ? localNow.getUTCDate() : localNow.getDate();
  const day = hasOffset ? localNow.getUTCDay() : localNow.getDay();

  const localToUtc = (ly, lm, ld, h, min, s, ms) => {
    if (!hasOffset) {
      return new Date(ly, lm, ld, h, min, s, ms);
    }
    return new Date(Date.UTC(ly, lm, ld, h, min, s, ms) + offsetMs);
  };

  if (period === 'today') {
    return {
      start: localToUtc(y, m, d, 0, 0, 0, 0),
      end: localToUtc(y, m, d, 23, 59, 59, 999),
    };
  }

  if (period === 'weekly') {
    return {
      start: localToUtc(y, m, d - day, 0, 0, 0, 0),
      end: localToUtc(y, m, d - day + 6, 23, 59, 59, 999),
    };
  }

  if (period === 'monthly') {
    return {
      start: localToUtc(y, m, 1, 0, 0, 0, 0),
      end: localToUtc(y, m + 1, 0, 23, 59, 59, 999),
    };
  }

  if (period === 'yearly') {
    return {
      start: localToUtc(y, 0, 1, 0, 0, 0, 0),
      end: localToUtc(y, 11, 31, 23, 59, 59, 999),
    };
  }

  if (period === 'financial-year') {
    const fyStartYear = m >= 6 ? y : y - 1;
    return {
      start: localToUtc(fyStartYear, 6, 1, 0, 0, 0, 0),
      end: localToUtc(fyStartYear + 1, 5, 30, 23, 59, 59, 999),
    };
  }

  return null;
};

module.exports = { getPeriodRange };
