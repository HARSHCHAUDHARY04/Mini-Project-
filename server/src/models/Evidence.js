const mongoose = require("mongoose");

// Individual requirement<->evidence match rows, denormalized from Analysis
// for querying/filtering (e.g. "show all NOT_FOUND items across claims").
const EvidenceSchema = new mongoose.Schema(
  {
    claimId: { type: String, required: true, index: true },
    requirementId: { type: String },
    requirementText: { type: String },
    patientEvidence: { type: String },
    status: { type: String, enum: ["MATCH", "PARTIAL", "NOT_FOUND", "CONFLICT"] },
    confidence: { type: Number, default: 0 },
    sourcePage: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Evidence", EvidenceSchema);
