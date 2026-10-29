const parseExplicitDateRange = (startDate, endDate) => {
  if (startDate === undefined && endDate === undefined) {
    return { range: null, error: null };
  }

  if (
    typeof startDate !== 'string' ||
    typeof endDate !== 'string' ||
    !startDate.trim() ||
    !endDate.trim()
  ) {
    return {
      range: null,
      error: 'Both startDate and endDate must be provided.',
    };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
    return { range: null, error: 'Date range contains an invalid date.' };
  }

  if (start > end) {
    return { range: null, error: 'Start date must be before end date.' };
  }

  return { range: { start, end }, error: null };
};

module.exports = { parseExplicitDateRange };
