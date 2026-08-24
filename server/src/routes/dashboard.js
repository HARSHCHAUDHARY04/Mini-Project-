const express = require("express");
const { getStats } = require("../controllers/dashboardController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);
router.get("/stats", getStats);

module.exports = router;
