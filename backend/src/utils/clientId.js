const isDuplicateKey = (error) => Boolean(error && error.code === 11000);

const findExistingByClientId = async (Model, userId, clientId) => {
  if (!clientId) return null;
  return Model.findOne({ userId, clientId }).lean();
};

const normalizeClientId = (value) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
};

module.exports = { isDuplicateKey, findExistingByClientId, normalizeClientId };
