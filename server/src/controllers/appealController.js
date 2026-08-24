const axios = require("axios");
const Claim = require("../models/Claim");
const Analysis = require("../models/Analysis");
const Appeal = require("../models/Appeal");
const asyncHandler = require("../utils/asyncHandler");
const ai = require("../services/aiServiceClient");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

const generateAppeal = asyncHandler(async (req, res) => {
  const claim = await Claim.findOne({ claimId: req.params.id });
  if (!claim) return res.status(404).json({ success: false, error: "Claim not found." });

  const analysis = await Analysis.findOne({ claimId: claim.claimId });
  if (!analysis) {
    return res.status(422).json({ success: false, error: "Run Analyze Claim before generating an appeal." });
  }

  const draft = await ai.generateAppeal({
    claim: claim.toObject(),
    denialInfo: analysis.denialInfo,
    policySections: analysis.policySections,
    matchedRequirements: analysis.matchedRequirements,
    appealability: analysis.appealability,
  });

  const appeal = await Appeal.findOneAndUpdate(
    { claimId: claim.claimId },
    {
      claimId: claim.claimId,
      content: draft.content,
      label: draft.label,
      citations: draft.citations,
      missingEvidence: draft.missingEvidence,
      complianceScore: analysis.appealability.score,
      status: "DRAFT",
    },
    { upsert: true, new: true }
  );

  claim.status = "APPEAL_GENERATED";
  await claim.save();

  res.status(201).json({ success: true, data: appeal });
});

const listAppeals = asyncHandler(async (req, res) => {
  const { status, claimId, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (claimId) filter.claimId = claimId;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [appeals, total] = await Promise.all([
    Appeal.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Appeal.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: appeals,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    }
  });
});

const getAppeal = asyncHandler(async (req, res) => {
  const appeal = await Appeal.findById(req.params.id);
  if (!appeal) return res.status(404).json({ success: false, error: "Appeal not found." });
  res.json({ success: true, data: appeal });
});

// Manual edits from the split-screen review page (spec section 17: [Edit]).
const updateAppeal = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const appeal = await Appeal.findByIdAndUpdate(
    req.params.id,
    { ...(content ? { content } : {}) },
    { new: true }
  );
  if (!appeal) return res.status(404).json({ success: false, error: "Appeal not found." });
  res.json({ success: true, data: appeal });
});

const approveAppeal = asyncHandler(async (req, res) => {
  const { action } = req.body; // "approve" | "reject"
  const status = action === "reject" ? "REJECTED" : "APPROVED";

  const appeal = await Appeal.findByIdAndUpdate(
    req.params.id,
    { status, reviewedAt: new Date(), reviewerId: req.user?.id },
    { new: true }
  );
  if (!appeal) return res.status(404).json({ success: false, error: "Appeal not found." });

  await Claim.findOneAndUpdate({ claimId: appeal.claimId }, { status });

  res.json({ success: true, data: appeal });
});

// Generates (if needed) and streams the appeal packet PDF back to the client.
const downloadPacket = asyncHandler(async (req, res) => {
  const appeal = await Appeal.findById(req.params.id);
  if (!appeal) return res.status(404).json({ success: false, error: "Appeal not found." });

  const claim = await Claim.findOne({ claimId: appeal.claimId });
  const analysis = await Analysis.findOne({ claimId: appeal.claimId });
  if (!claim || !analysis) {
    return res.status(422).json({ success: false, error: "Missing claim or analysis data for this appeal." });
  }

  const packet = await ai.generatePacket({
    claim: claim.toObject(),
    denialInfo: analysis.denialInfo,
    matchedRequirements: analysis.matchedRequirements,
    evidence: analysis.clinicalEvidence,
    appeal: { content: appeal.content, label: appeal.label, citations: appeal.citations },
    appealability: analysis.appealability,
    reviewerStatus: appeal.status === "DRAFT" ? "Pending Review" : appeal.status,
    outputFileName: `${claim.claimId}-appeal-packet.pdf`,
  });

  appeal.pdfFileName = packet.fileName;
  await appeal.save();

  const fileResponse = await axios.get(`${AI_SERVICE_URL}/ai/packet/${packet.fileName}`, {
    responseType: "stream",
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${packet.fileName}"`);
  fileResponse.data.pipe(res);
});

module.exports = { generateAppeal, listAppeals, getAppeal, updateAppeal, approveAppeal, downloadPacket };
