const AuditLog = require("../models/AuditLog");
const asyncHandler = require("../utils/asyncHandler");

const listAuditLogs = asyncHandler(async (req, res) => {
  const { action, resource, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (action) filter.action = action;
  if (resource) filter.resource = resource;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    AuditLog.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
  });
});

module.exports = { listAuditLogs };
