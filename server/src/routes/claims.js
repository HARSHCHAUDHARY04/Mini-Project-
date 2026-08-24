const express = require("express");
const {
  createClaim, uploadClaim, listClaims, getClaim, updateClaim, deleteClaim, loadDemoCase,
} = require("../controllers/claimController");
const { analyzeClaim, getAnalysis } = require("../controllers/analysisController");
const { generateAppeal } = require("../controllers/appealController");
const { requireAuth, requireRole } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

const router = express.Router();

router.use(requireAuth);

// Admin / Billing Staff only: uploading, mutating, and running AI analysis
// (spec section 4 — Reviewer can view/review/approve but not originate work).
router.post("/demo", requireRole("admin"), loadDemoCase);
router.post("/upload", requireRole("admin"), upload.single("file"), uploadClaim);

router.post("/", requireRole("admin"), createClaim);
router.get("/", listClaims);
router.get("/:id", getClaim);
router.put("/:id", requireRole("admin"), updateClaim);
router.delete("/:id", requireRole("admin"), deleteClaim);

router.post("/:id/analyze", requireRole("admin"), analyzeClaim);
router.get("/:id/analysis", getAnalysis);
router.post("/:id/generate-appeal", requireRole("admin"), generateAppeal);

module.exports = router;
