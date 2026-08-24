const path = require("path");
const { randomUUID } = require("crypto");
const Policy = require("../models/Policy");
const PolicyChunk = require("../models/PolicyChunk");
const asyncHandler = require("../utils/asyncHandler");
const ai = require("../services/aiServiceClient");

const uploadPolicy = asyncHandler(async (req, res) => {
  const { payer, policyName, policyType, version } = req.body;
  if (!req.file) return res.status(422).json({ success: false, error: "No policy file uploaded." });
  if (!payer || !policyName) {
    return res.status(422).json({ success: false, error: "payer and policyName are required." });
  }

  const policyId = `POL-${randomUUID().slice(0, 8)}`;
  const policy = await Policy.create({
    policyId,
    policyName,
    payer,
    policyType: policyType || "Medical Necessity",
    version: version || "1.0",
    sourceFile: req.file.filename,
    indexed: false,
  });

  res.status(201).json({ success: true, data: policy });
});

// Separated from upload so the UI can show "Uploaded" -> "Indexing..." ->
// "Indexed" states distinctly (spec section 9).
const indexPolicyById = asyncHandler(async (req, res) => {
  const policy = await Policy.findOne({ policyId: req.params.id });
  if (!policy) return res.status(404).json({ success: false, error: "Policy not found." });

  const filePath = path.join(
    process.env.UPLOAD_DIR || path.join(__dirname, "..", "..", "storage", "uploads"),
    policy.sourceFile
  );

  const result = await ai.indexPolicy({
    policyId: policy.policyId,
    payer: policy.payer,
    policyName: policy.policyName,
    filePath,
  });

  policy.indexed = true;
  policy.chunkCount = result.chunkCount;
  await policy.save();

  res.json({ success: true, data: policy });
});

// Indexes a policy directly from raw text (used by the demo-case flow, which
// reads bundled synthetic .txt policy fixtures rather than uploaded files).
const indexPolicyFromText = asyncHandler(async (req, res) => {
  const { policyId, payer, policyName, rawText } = req.body;
  if (!policyId || !payer || !policyName || !rawText) {
    return res.status(422).json({ success: false, error: "policyId, payer, policyName, and rawText are required." });
  }
  const result = await ai.indexPolicy({ policyId, payer, policyName, rawText });

  await Policy.findOneAndUpdate(
    { policyId },
    { policyId, payer, policyName, indexed: true, chunkCount: result.chunkCount },
    { upsert: true }
  );

  res.json({ success: true, data: result });
});

const listPolicies = asyncHandler(async (req, res) => {
  const policies = await Policy.find().sort({ createdAt: -1 });
  res.json({ success: true, data: policies });
});

module.exports = { uploadPolicy, indexPolicyById, indexPolicyFromText, listPolicies };
