const fs = require("fs");
const path = require("path");
const Claim = require("../models/Claim");
const Patient = require("../models/Patient");
const Policy = require("../models/Policy");
const ClinicalDocument = require("../models/ClinicalDocument");
const asyncHandler = require("../utils/asyncHandler");
const ai = require("../services/aiServiceClient");

const DEMO_DIR = process.env.DEMO_DATA_DIR || path.join(__dirname, "..", "..", "..", "data", "demo");

function extFileType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".pdf") return "pdf";
  if (ext === ".csv") return "csv";
  if (ext === ".json") return "json";
  return "txt";
}

const CLAIM_CREATE_FIELDS = [
  "claimId", "patientId", "patientName", "payer", "procedure", "procedureCode",
  "diagnosisCode", "denialCode", "denialReason", "eobExplanation", "amount",
  "dateOfService", "provider", "sourceFile",
];
const CLAIM_UPDATE_FIELDS = [
  "patientId", "patientName", "payer", "procedure", "procedureCode", "diagnosisCode",
  "denialCode", "denialReason", "eobExplanation", "amount", "dateOfService", "provider",
  "status", "appealabilityScore", "appealabilityClassification",
];

function pick(source, fields) {
  const out = {};
  for (const f of fields) {
    if (source[f] !== undefined) out[f] = source[f];
  }
  return out;
}

const createClaim = asyncHandler(async (req, res) => {
  const payload = pick(req.body, CLAIM_CREATE_FIELDS);
  if (!payload.claimId || !payload.payer || !payload.procedure) {
    return res.status(422).json({ success: false, error: "claimId, payer, and procedure are required." });
  }
  const existing = await Claim.findOne({ claimId: payload.claimId });
  if (existing) {
    return res.status(409).json({ success: false, error: `Claim ${payload.claimId} already exists.` });
  }
  const claim = await Claim.create({ ...payload, uploadedBy: req.user?.id, status: "UPLOADED" });
  res.status(201).json({ success: true, data: claim });
});

// Handles multipart file upload (PDF/TXT/CSV/JSON), calls the AI service to
// parse structured fields out of it, then creates the Claim record.
const uploadClaim = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(422).json({ success: false, error: "No file uploaded." });
  }
  const fileType = extFileType(req.file.originalname);
  const parsed = await ai.parseClaim({ filePath: req.file.path, fileType });

  if (!parsed.claimId) {
    return res.status(200).json({
      success: true,
      data: { parsed, requiresManualCorrection: true, sourceFile: req.file.filename },
    });
  }

  const existing = await Claim.findOne({ claimId: parsed.claimId });
  if (existing) {
    return res.status(409).json({ success: false, error: `Claim ${parsed.claimId} already exists.` });
  }

  const claim = await Claim.create({
    claimId: parsed.claimId,
    patientId: parsed.patientId,
    patientName: parsed.patientName,
    payer: parsed.payer,
    procedure: parsed.procedure,
    procedureCode: parsed.procedureCode,
    diagnosisCode: parsed.diagnosisCode,
    denialCode: parsed.denialCode,
    denialReason: parsed.denialReason,
    eobExplanation: parsed.eobExplanation,
    amount: parsed.amount || 0,
    dateOfService: parsed.dateOfService,
    provider: parsed.provider,
    sourceFile: req.file.filename,
    status: "UPLOADED",
    uploadedBy: req.user?.id,
  });

  res.status(201).json({ success: true, data: { claim, extraction: parsed } });
});

const listClaims = asyncHandler(async (req, res) => {
  const { status, appealability, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (appealability) filter.appealabilityClassification = appealability;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [claims, total] = await Promise.all([
    Claim.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Claim.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: claims,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    }
  });
});

const getClaim = asyncHandler(async (req, res) => {
  const claim = await Claim.findOne({ claimId: req.params.id });
  if (!claim) return res.status(404).json({ success: false, error: "Claim not found." });
  res.json({ success: true, data: claim });
});

const updateClaim = asyncHandler(async (req, res) => {
  const payload = pick(req.body, CLAIM_UPDATE_FIELDS);
  const claim = await Claim.findOneAndUpdate(
    { claimId: req.params.id },
    payload,
    { new: true, runValidators: true, context: "query" }
  );
  if (!claim) return res.status(404).json({ success: false, error: "Claim not found." });
  res.json({ success: true, data: claim });
});

const deleteClaim = asyncHandler(async (req, res) => {
  const claim = await Claim.findOneAndDelete({ claimId: req.params.id });
  if (!claim) return res.status(404).json({ success: false, error: "Claim not found." });
  res.json({ success: true, data: { deleted: true } });
});

// Loads the bundled synthetic demo case (spec section 25) so the full
// workflow can be demonstrated without manually uploading files.
const loadDemoCase = asyncHandler(async (req, res) => {
  const bundlePath = path.join(DEMO_DIR, "demo_case.json");
  if (!fs.existsSync(bundlePath)) {
    return res.status(500).json({ success: false, error: "Demo data bundle not found on server." });
  }
  const bundle = JSON.parse(fs.readFileSync(bundlePath, "utf-8"));

  // 1. Upsert Patient
  await Patient.findOneAndUpdate(
    { patientId: bundle.patient.patientId },
    bundle.patient,
    { upsert: true, new: true }
  );

  // 2. Index the demo policy from raw text file on the server
  const policyId = `POL-${bundle.claim.claimId}`;
  const policyText = fs.readFileSync(path.join(DEMO_DIR, "policies", bundle.policy.sourceFile), "utf-8");
  const indexResult = await ai.indexPolicy({
    policyId,
    payer: bundle.policy.payer,
    policyName: bundle.policy.policyName,
    rawText: policyText,
  });

  await Policy.findOneAndUpdate(
    { policyId },
    {
      policyId,
      payer: bundle.policy.payer,
      policyName: bundle.policy.policyName,
      policyType: bundle.policy.policyType,
      version: bundle.policy.version,
      sourceFile: bundle.policy.sourceFile,
      indexed: true,
      chunkCount: indexResult.chunkCount,
    },
    { upsert: true }
  );

  // 3. Upsert clinical document details
  await ClinicalDocument.findOneAndUpdate(
    { claimId: bundle.claim.claimId },
    {
      claimId: bundle.claim.claimId,
      patientId: bundle.patient.patientId,
      title: bundle.clinicalDocument.title,
      sourceFile: bundle.clinicalDocument.sourceFile,
      isSynthetic: true,
    },
    { upsert: true }
  );

  // 4. Create/Upsert Claim
  let claim = await Claim.findOne({ claimId: bundle.claim.claimId });
  if (!claim) {
    claim = await Claim.create({ ...bundle.claim, uploadedBy: req.user?.id });
  }

  res.json({
    success: true,
    data: {
      claim,
      policyId,
    },
  });
});

module.exports = {
  createClaim,
  uploadClaim,
  listClaims,
  getClaim,
  updateClaim,
  deleteClaim,
  loadDemoCase,
};
