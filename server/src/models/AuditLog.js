const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    userName: { type: String, default: "System" },
    action: { type: String, required: true }, // e.g. "CLAIM_CREATED", "CLAIM_DELETED", "APPEAL_APPROVED", "LOGIN_FAILED"
    resource: { type: String, required: true }, // e.g. "Claim", "Appeal", "User"
    resourceId: { type: String, default: null },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", AuditLogSchema);
