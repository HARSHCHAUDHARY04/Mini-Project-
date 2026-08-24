const mongoose = require("mongoose");

const ClinicalDocumentSchema = new mongoose.Schema(
  {
    claimId: { type: String, index: true },
    patientId: { type: String },
    title: { type: String, required: true },
    sourceFile: { type: String },
    isSynthetic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ClinicalDocument", ClinicalDocumentSchema);
