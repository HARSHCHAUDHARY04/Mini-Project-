const mongoose = require("mongoose");

const AppealSchema = new mongoose.Schema(
  {
    claimId: { type: String, required: true, index: true },
    content: { type: String, required: true },
    label: { type: String, default: "AI-GENERATED DRAFT — REQUIRES HUMAN REVIEW" },
    citations: { type: mongoose.Schema.Types.Mixed },
    missingEvidence: { type: [String], default: [] },
    complianceScore: { type: Number, default: null },
    status: {
      type: String,
      enum: ["DRAFT", "UNDER_REVIEW", "APPROVED", "REJECTED"],
      default: "DRAFT",
    },
    generatedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date, default: null },
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    pdfFileName: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appeal", AppealSchema);
