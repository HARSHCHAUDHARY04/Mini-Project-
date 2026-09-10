const express = require("express");
const { listUsers, updateUserRole, deleteUser } = require("../controllers/userController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));
router.get("/", listUsers);
router.put("/:id/role", updateUserRole);
router.delete("/:id", deleteUser);

module.exports = router;
