const DeletedRecord = require('../models/DeletedRecord');

const recordDeletion = async (userId, entity, recordId) => {
  if (!userId || !entity || !recordId) return;
  await DeletedRecord.create({
    userId,
    entity,
    recordId: String(recordId),
  });
};

module.exports = { recordDeletion };
