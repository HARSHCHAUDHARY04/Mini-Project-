const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { logAudit } = require("../middleware/auditLogger");

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

function signToken(user) {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(422).json({ success: false, error: "Name, email, and password are required." });
  }
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ success: false, error: "An account with this email already exists." });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: role === "reviewer" ? "reviewer" : "admin",
  });
  const token = signToken(user);
  await logAudit({ req: { ...req, user: { id: user._id, name: user.name } }, action: "USER_REGISTER", resource: "User", resourceId: user._id.toString() });
  res.status(201).json({
    success: true,
    data: { token, user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(422).json({ success: false, error: "Email and password are required." });
  }
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ success: false, error: "Invalid email or password." });
  }

  // Account lockout check
  if (user.isLocked()) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
    await logAudit({ req, action: "LOGIN_BLOCKED_LOCKED", resource: "User", resourceId: user._id.toString() });
    return res.status(423).json({
      success: false,
      error: `Account is temporarily locked due to multiple failed login attempts. Try again in ${minutesLeft} minute(s).`,
    });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
      await user.save();
      await logAudit({ req, action: "ACCOUNT_LOCKED", resource: "User", resourceId: user._id.toString() });
      return res.status(423).json({
        success: false,
        error: "Account locked due to 5 consecutive failed login attempts. Please wait 15 minutes.",
      });
    }
    await user.save();
    await logAudit({ req, action: "LOGIN_FAILED", resource: "User", resourceId: user._id.toString() });
    return res.status(401).json({ success: false, error: "Invalid email or password." });
  }

  // Reset login attempts on success
  user.loginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  const token = signToken(user);
  await logAudit({ req: { ...req, user: { id: user._id, name: user.name } }, action: "USER_LOGIN", resource: "User", resourceId: user._id.toString() });

  res.json({
    success: true,
    data: { token, user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } },
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-passwordHash");
  if (!user) {
    return res.status(404).json({ success: false, error: "User not found." });
  }
  res.json({ success: true, data: user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatar } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, error: "User not found." });
  }
  if (name) user.name = name;
  if (avatar !== undefined) user.avatar = avatar;
  await user.save();

  await logAudit({ req, action: "PROFILE_UPDATED", resource: "User", resourceId: user._id.toString() });
  res.json({
    success: true,
    data: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
  });
});

const googleStart = (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({ success: false, error: "Google OAuth is not configured." });
  }
  const url = googleClient.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
  });
  return res.redirect(url);
};

const googleCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;
  const frontendUrl = process.env.CLIENT_ORIGIN || "http://127.0.0.1:5173";
  if (!code) return res.redirect(`${frontendUrl}/login?oauth_error=missing_code`);

  const { tokens } = await googleClient.getToken(code);
  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.email || !payload.email_verified) {
    return res.redirect(`${frontendUrl}/login?oauth_error=unverified_email`);
  }

  const email = payload.email.toLowerCase();
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: payload.name || email.split("@")[0],
      email,
      googleId: payload.sub,
      passwordHash: crypto.randomBytes(32).toString("hex"),
      role: "admin",
    });
  } else if (!user.googleId) {
    user.googleId = payload.sub;
    await user.save();
  }

  const token = signToken(user);
  return res.redirect(`${frontendUrl}/login#oauth_token=${encodeURIComponent(token)}`);
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(422).json({ success: false, error: "Current password and new password are required." });
  }
  if (newPassword.length < 8) {
    return res.status(422).json({ success: false, error: "New password must be at least 8 characters long." });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, error: "User not found." });
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ success: false, error: "Invalid current password." });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  await logAudit({ req, action: "PASSWORD_CHANGED", resource: "User", resourceId: user._id.toString() });

  res.json({ success: true, message: "Password updated successfully." });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(422).json({ success: false, error: "Email is required." });
  }
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Don't reveal whether the email exists
    return res.json({ success: true, message: "If that email is registered, a reset link has been generated. Check the server console." });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  // In a real app, send this via email. For this prototype, log to console.
  console.log(`\n==== PASSWORD RESET TOKEN ====`);
  console.log(`Email: ${user.email}`);
  console.log(`Token: ${resetToken}`);
  console.log(`Expires: ${user.resetPasswordExpires.toISOString()}`);
  console.log(`==============================\n`);

  await logAudit({ req: { ...req, user: { id: user._id, name: user.name } }, action: "PASSWORD_RESET_REQUESTED", resource: "User", resourceId: user._id.toString() });
  res.json({ success: true, message: "If that email is registered, a reset link has been generated. Check the server console." });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(422).json({ success: false, error: "Token and new password are required." });
  }
  if (newPassword.length < 8) {
    return res.status(422).json({ success: false, error: "New password must be at least 8 characters long." });
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ success: false, error: "Invalid or expired reset token." });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  user.loginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  await logAudit({ req: { ...req, user: { id: user._id, name: user.name } }, action: "PASSWORD_RESET_COMPLETED", resource: "User", resourceId: user._id.toString() });
  res.json({ success: true, message: "Password has been reset successfully. You can now log in." });
});

module.exports = { register, login, me, updateProfile, googleStart, googleCallback, changePassword, forgotPassword, resetPassword };
