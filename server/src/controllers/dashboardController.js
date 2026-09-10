const Claim = require("../models/Claim");
const Appeal = require("../models/Appeal");
const asyncHandler = require("../utils/asyncHandler");

const getStats = asyncHandler(async (req, res) => {
  const [totalClaims, deniedClaims, appealableClaims, appealsGenerated, appealsApproved, appealsPending] =
    await Promise.all([
      Claim.countDocuments({}),
      Claim.countDocuments({ denialCode: { $exists: true, $ne: null } }),
      Claim.countDocuments({ appealabilityClassification: { $in: ["Strong", "Moderate"] } }),
      Appeal.countDocuments({}),
      Appeal.countDocuments({ status: "APPROVED" }),
      Appeal.countDocuments({ status: { $in: ["DRAFT", "UNDER_REVIEW"] } }),
    ]);

  const potentialRecoveryAgg = await Claim.aggregate([
    { $match: { appealabilityClassification: { $in: ["Strong", "Moderate"] } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const potentialRecovery = potentialRecoveryAgg[0]?.total || 0;

  const claimsByStatus = await Claim.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $project: { status: "$_id", count: 1, _id: 0 } },
  ]);

  const denialCodeDistribution = await Claim.aggregate([
    { $match: { denialCode: { $ne: null } } },
    { $group: { _id: "$denialCode", count: { $sum: 1 } } },
    { $project: { denialCode: "$_id", count: 1, _id: 0 } },
  ]);

  const recoveryByMonth = await Claim.aggregate([
    { $match: { appealabilityClassification: { $in: ["Strong", "Moderate"] } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        total: { $sum: "$amount" },
      },
    },
    { $project: { month: "$_id", total: 1, _id: 0 } },
    { $sort: { month: 1 } },
  ]);

  const appealsOverTime = await Appeal.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $project: { month: "$_id", count: 1, _id: 0 } },
    { $sort: { month: 1 } },
  ]);

  res.json({
    success: true,
    data: {
      totalClaims,
      deniedClaims,
      appealableClaims,
      appealsGenerated,
      appealsApproved,
      appealsPending,
      potentialRecovery,
      claimsByStatus,
      denialCodeDistribution,
      recoveryByMonth,
      appealsOverTime,
    },
  });
});

const exportStatsCSV = asyncHandler(async (req, res) => {
  const [totalClaims, deniedClaims, appealableClaims, appealsGenerated, appealsApproved, appealsPending] =
    await Promise.all([
      Claim.countDocuments({}),
      Claim.countDocuments({ denialCode: { $exists: true, $ne: null } }),
      Claim.countDocuments({ appealabilityClassification: { $in: ["Strong", "Moderate"] } }),
      Appeal.countDocuments({}),
      Appeal.countDocuments({ status: "APPROVED" }),
      Appeal.countDocuments({ status: { $in: ["DRAFT", "UNDER_REVIEW"] } }),
    ]);

  const potentialRecoveryAgg = await Claim.aggregate([
    { $match: { appealabilityClassification: { $in: ["Strong", "Moderate"] } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const potentialRecovery = potentialRecoveryAgg[0]?.total || 0;

  const denialCodeDistribution = await Claim.aggregate([
    { $match: { denialCode: { $ne: null } } },
    { $group: { _id: "$denialCode", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const lines = [
    "Metric,Value",
    `Total Claims,${totalClaims}`,
    `Denied Claims,${deniedClaims}`,
    `Appealable Claims,${appealableClaims}`,
    `Appeals Generated,${appealsGenerated}`,
    `Appeals Approved,${appealsApproved}`,
    `Appeals Pending Review,${appealsPending}`,
    `Potential Recovery ($),${potentialRecovery.toFixed(2)}`,
    "",
    "Denial Code,Occurrences",
    ...denialCodeDistribution.map((d) => `"${d._id}",${d.count}`),
  ];

  const csvContent = lines.join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="analytics-summary.csv"');
  res.status(200).send(csvContent);
});

module.exports = { getStats, exportStatsCSV };
