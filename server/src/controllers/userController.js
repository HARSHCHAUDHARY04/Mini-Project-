const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { logAudit } = require("../middleware/auditLogger");

const listUsers = asyncHandler(async (req, res) => {
  const { role, q, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (q) {
    const searchRegex = new RegExp(q, "i");
    filter.$or = [{ name: searchRegex }, { email: searchRegex }];
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(filter).select("-passwordHash").sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: users,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
  });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!role || !["admin", "reviewer"].includes(role)) {
    return res.status(422).json({ success: false, error: "Role must be 'admin' or 'reviewer'." });
  }

  if (req.params.id === req.user.id) {
    return res.status(403).json({ success: false, error: "You cannot change your own role." });
  }

  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-passwordHash");
  if (!user) return res.status(404).json({ success: false, error: "User not found." });

  await logAudit({ req, action: "USER_ROLE_CHANGED", resource: "User", resourceId: user._id.toString(), details: { newRole: role } });
  res.json({ success: true, data: user });
});

const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(403).json({ success: false, error: "You cannot delete your own account." });
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ success: false, error: "User not found." });

  await logAudit({ req, action: "USER_DELETED", resource: "User", resourceId: user._id.toString(), details: { email: user.email } });
  res.json({ success: true, data: { deleted: true } });
});

module.exports = { listUsers, updateUserRole, deleteUser };
