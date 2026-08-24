const express = require("express");
const {
  uploadPolicy, indexPolicyById, indexPolicyFromText, listPolicies,
} = require("../controllers/policyController");
const { requireAuth, requireRole } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

const router = express.Router();

router.use(requireAuth);

router.post("/upload", requireRole("admin"), upload.single("file"), uploadPolicy);
router.post("/index-text", requireRole("admin"), indexPolicyFromText); // used by demo-case flow
router.post("/:id/index", requireRole("admin"), indexPolicyById);
router.get("/", listPolicies);

module.exports = router;
