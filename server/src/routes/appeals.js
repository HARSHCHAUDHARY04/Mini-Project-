const express = require("express");
const {
  listAppeals, getAppeal, updateAppeal, approveAppeal, downloadPacket,
} = require("../controllers/appealController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", listAppeals);
router.get("/:id", getAppeal);
router.put("/:id", updateAppeal);
router.post("/:id/approve", approveAppeal);
router.get("/:id/pdf", downloadPacket);

module.exports = router;
