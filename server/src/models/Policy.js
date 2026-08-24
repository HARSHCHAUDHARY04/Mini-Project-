const mongoose = require("mongoose");

const PolicySchema = new mongoose.Schema(
  {
    policyId: { type: String, required: true, unique: true },
    policyName: { type: String, required: true },
    payer: { type: String, required: true },
    policyType: { type: String, default: "Medical Necessity" },
    version: { type: String, default: "1.0" },
    sourceFile: { type: String },
    indexed: { type: Boolean, default: false },
    chunkCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Policy", PolicySchema);
