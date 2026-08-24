const express = require("express");
const { searchPolicy } = require("../controllers/ragController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);
router.post("/search", searchPolicy);

module.exports = router;
