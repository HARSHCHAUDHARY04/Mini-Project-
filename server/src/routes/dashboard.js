const express = require("express");
const { getStats, exportStatsCSV } = require("../controllers/dashboardController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);
router.get("/stats", getStats);
router.get("/export/csv", exportStatsCSV);

module.exports = router;

