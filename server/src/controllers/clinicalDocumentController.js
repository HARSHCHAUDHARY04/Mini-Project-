const ClinicalDocument = require("../models/ClinicalDocument");
const asyncHandler = require("../utils/asyncHandler");

const uploadClinicalDocument = asyncHandler(async (req, res) => {
  const { claimId, patientId, title } = req.body;
  if (!req.file) return res.status(422).json({ success: false, error: "No clinical document uploaded." });
  if (!title) return res.status(422).json({ success: false, error: "title is required." });

  const doc = await ClinicalDocument.create({
    claimId,
    patientId,
    title,
    sourceFile: req.file.filename,
  });

  res.status(201).json({ success: true, data: doc });
});

const listClinicalDocuments = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.claimId) filter.claimId = req.query.claimId;
  const docs = await ClinicalDocument.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: docs });
});

module.exports = { uploadClinicalDocument, listClinicalDocuments };
