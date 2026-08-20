export const toBaseAmount = (value, currency, conversionRate = 1) => {
  const amount = Number(value) || 0;

  if (currency === 'PKR') {
    return amount;
  }

  if (currency === 'USD') {
    return amount * conversionRate;
  }

  return amount;
};

export const fromBaseAmount = (value, currency, conversionRate = 1) => {
  const amount = Number(value) || 0;

  if (currency === 'PKR') {
    return amount;
  }

  if (currency === 'USD') {
    return amount / conversionRate;
  }

  return amount;
};
