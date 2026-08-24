const mongoose = require("mongoose");

// Synthetic/demo patient identifiers only. Do not store real PHI.
const PatientSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    isSynthetic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", PatientSchema);
