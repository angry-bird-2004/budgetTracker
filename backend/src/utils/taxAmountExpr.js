const taxAmountExpr = {
  $cond: [
    { $gt: [{ $ifNull: ['$taxAmount', 0] }, 0] },
    { $ifNull: ['$taxAmount', 0] },
    {
      $divide: [
        {
          $multiply: [
            { $ifNull: ['$amount', 0] },
            { $ifNull: ['$taxPercentage', 0] },
          ],
        },
        100,
      ],
    },
  ],
};

module.exports = { taxAmountExpr };
