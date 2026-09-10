const express = require("express");
const { listNotifications, markRead, markAllRead } = require("../controllers/notificationController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", listNotifications);
router.put("/read-all", markAllRead);
router.put("/:id/read", markRead);

module.exports = router;
