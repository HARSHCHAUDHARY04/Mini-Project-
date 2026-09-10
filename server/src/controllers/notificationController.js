const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");

const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user.id })
    .sort({ read: 1, createdAt: -1 })
    .limit(30);

  const unreadCount = await Notification.countDocuments({ userId: req.user.id, read: false });

  res.json({ success: true, data: { notifications, unreadCount } });
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { read: true },
    { new: true }
  );
  if (!notification) return res.status(404).json({ success: false, error: "Notification not found." });
  res.json({ success: true, data: notification });
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
  res.json({ success: true, message: "All notifications marked as read." });
});

module.exports = { listNotifications, markRead, markAllRead };
