const mongoose = require("mongoose");

const STATUSES = [
  "UPLOADED",
  "PARSING",
  "ANALYZED",
  "NEEDS_EVIDENCE",
  "READY_FOR_APPEAL",
  "APPEAL_GENERATED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
];

const ClaimSchema = new mongoose.Schema(
  {
    claimId: { type: String, required: true, unique: true },
    patientId: { type: String },
    patientName: { type: String },
    payer: { type: String, required: true },
    procedure: { type: String, required: true },
    procedureCode: { type: String },
    diagnosisCode: { type: String },
    denialCode: { type: String },
    denialReason: { type: String },
    eobExplanation: { type: String },
    amount: { type: Number, default: 0 },
    dateOfService: { type: String },
    provider: { type: String },
    status: { type: String, enum: STATUSES, default: "UPLOADED" },
    appealabilityScore: { type: Number, default: null },
    appealabilityClassification: { type: String, default: null },
    sourceFile: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

ClaimSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model("Claim", ClaimSchema);
