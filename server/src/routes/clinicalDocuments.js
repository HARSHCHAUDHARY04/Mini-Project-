const express = require("express");
const { uploadClinicalDocument, listClinicalDocuments } = require("../controllers/clinicalDocumentController");
const { requireAuth, requireRole } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

const router = express.Router();

router.use(requireAuth);

router.post("/upload", requireRole("admin"), upload.single("file"), uploadClinicalDocument);
router.get("/", listClinicalDocuments);

module.exports = router;
