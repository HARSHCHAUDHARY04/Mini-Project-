const path = require("path");
const fs = require("fs");
const Claim = require("../models/Claim");
const Analysis = require("../models/Analysis");
const Evidence = require("../models/Evidence");
const Policy = require("../models/Policy");
const ClinicalDocument = require("../models/ClinicalDocument");
const asyncHandler = require("../utils/asyncHandler");
const ai = require("../services/aiServiceClient");

// Orchestrates the full pipeline (spec sections 8-14):
// denial analysis -> RAG policy retrieval -> requirement extraction ->
// clinical evidence extraction -> requirement matching -> appealability score.
// This is the single most important endpoint in the app - it's what
// "Analyze Claim" calls.
const analyzeClaim = asyncHandler(async (req, res) => {
  const claim = await Claim.findOne({ claimId: req.params.id });
  if (!claim) return res.status(404).json({ success: false, error: "Claim not found." });

  let { policyId, clinicalRawText, clinicalFilePath } = req.body;

  // #10 — Server-side fallback: look up the policy by payer if not specified
  if (!policyId) {
    const policy = await Policy.findOne({ payer: claim.payer, indexed: true });
    if (policy) {
      policyId = policy.policyId;
    } else {
      return res.status(422).json({ success: false, error: `No indexed policy found for payer "${claim.payer}".` });
    }
  }

  // #10 — Server-side fallback: look up clinical documents for this claim/patient if not provided
  if (!clinicalRawText && !clinicalFilePath) {
    const clinicalDoc = await ClinicalDocument.findOne({
      $or: [{ claimId: claim.claimId }, { patientId: claim.patientId }]
    });
    if (clinicalDoc) {
      const isDemo = clinicalDoc.sourceFile.startsWith("demo_");
      const baseDir = isDemo
        ? path.join(__dirname, "..", "..", "..", "data", "demo", "clinical")
        : (process.env.UPLOAD_DIR || path.join(__dirname, "..", "..", "storage", "uploads"));
      clinicalFilePath = path.join(baseDir, clinicalDoc.sourceFile);
    } else {
      return res.status(422).json({
        success: false,
        error: "Provide clinicalRawText/clinicalFilePath or upload clinical notes first.",
      });
    }
  }

  claim.status = "PARSING";
  await claim.save();

  const denialInfo = claim.denialCode
    ? await ai.getDenialCode(claim.denialCode)
    : { code: null, category: "Unknown / Unmapped Denial Code", explanation: "No denial code on this claim." };

  const clinicalEvidence = await ai.extractClinicalEvidence(
    clinicalRawText ? { rawText: clinicalRawText } : { filePath: clinicalFilePath }
  );

  const query = `What medical necessity requirements apply to ${claim.procedure}${
    denialInfo.category ? ` given a denial for ${denialInfo.category}` : ""
  }?`;
  const policySections = await ai.retrievePolicy({ policyId, query, topK: 6 });

  const requirements = await ai.extractRequirements({ policyChunks: policySections });
  const matchedRequirements = await ai.matchEvidence({ requirements, evidence: clinicalEvidence });

  const appealability = await ai.scoreAppealability({
    matchedRequirements,
    evidenceCompleteness: clinicalEvidence.extractionCompleteness || 0,
    denialCodeKnown: denialInfo.category !== "Unknown / Unmapped Denial Code",
  });

  const analysis = await Analysis.findOneAndUpdate(
    { claimId: claim.claimId },
    { claimId: claim.claimId, denialInfo, clinicalEvidence, policySections, requirements, matchedRequirements, appealability },
    { upsert: true, new: true }
  );

  await Evidence.deleteMany({ claimId: claim.claimId });
  await Evidence.insertMany(
    matchedRequirements.map((m) => ({
      claimId: claim.claimId,
      requirementId: m.requirementId,
      requirementText: m.requirement,
      patientEvidence: m.patientEvidence,
      status: m.status,
      confidence: m.confidence,
      sourcePage: m.source,
    }))
  );

  const hasGaps = matchedRequirements.some((m) => m.status === "NOT_FOUND");
  claim.status = hasGaps ? "NEEDS_EVIDENCE" : "READY_FOR_APPEAL";
  claim.appealabilityScore = appealability.score;
  claim.appealabilityClassification = appealability.classification;
  await claim.save();

  res.json({ success: true, data: { claim, analysis } });
});

const getAnalysis = asyncHandler(async (req, res) => {
  const analysis = await Analysis.findOne({ claimId: req.params.id });
  if (!analysis) return res.status(404).json({ success: false, error: "No analysis found for this claim yet." });
  res.json({ success: true, data: analysis });
});

module.exports = { analyzeClaim, getAnalysis };
