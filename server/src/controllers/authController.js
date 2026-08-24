const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

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
  res.status(201).json({
    success: true,
    data: { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } },
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
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ success: false, error: "Invalid email or password." });
  }
  const token = signToken(user);
  res.json({
    success: true,
    data: { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } },
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-passwordHash");
  if (!user) {
    return res.status(404).json({ success: false, error: "User not found." });
  }
  res.json({ success: true, data: user });
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

  res.json({ success: true, message: "Password updated successfully." });
});

module.exports = { register, login, me, googleStart, googleCallback, changePassword };
