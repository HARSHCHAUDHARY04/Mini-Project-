const mongoose = require("mongoose");
const AuditLog = require("../models/AuditLog");

async function logAudit({ req, action, resource, resourceId, details }) {
  try {
    const rawUserId = req?.user?.id;
    const userId = rawUserId && mongoose.isValidObjectId(rawUserId) ? rawUserId : null;
    const userName = req?.user?.name || "System";
    const ipAddress = req?.ip || req?.headers?.["x-forwarded-for"] || req?.socket?.remoteAddress || "";

    await AuditLog.create({
      userId,
      userName,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
    });
  } catch (err) {
    console.error("[AuditLog Error]", err.message);
  }
}

module.exports = { logAudit };

