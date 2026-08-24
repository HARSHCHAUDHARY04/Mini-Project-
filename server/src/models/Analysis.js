const mongoose = require("mongoose");

// Stores the full result of running "Analyze Claim": denial info, retrieved
// policy sections, extracted requirements, matched evidence, and the
// explainable appealability score - everything the Claim Detail page's
// "AI Analysis" tab and the appeal generator need.
const AnalysisSchema = new mongoose.Schema(
  {
    claimId: { type: String, required: true, unique: true, index: true },
    denialInfo: { type: mongoose.Schema.Types.Mixed },
    clinicalEvidence: { type: mongoose.Schema.Types.Mixed },
    policySections: { type: [mongoose.Schema.Types.Mixed], default: [] },
    requirements: { type: [mongoose.Schema.Types.Mixed], default: [] },
    matchedRequirements: { type: [mongoose.Schema.Types.Mixed], default: [] },
    appealability: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Analysis", AnalysisSchema);
