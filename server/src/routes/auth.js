const express = require("express");
const { register, login, me, updateProfile, googleStart, googleCallback, changePassword } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.put("/profile", requireAuth, updateProfile);
router.put("/password", requireAuth, changePassword);
router.get("/google", googleStart);
router.get("/google/callback", googleCallback);

module.exports = router;
