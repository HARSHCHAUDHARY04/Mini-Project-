import { describe, it, expect, vi, beforeEach } from "vitest";

const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const { forgotPassword, resetPassword } = require("./authController");

describe("authController - Password Reset", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuditLog, "create").mockResolvedValue({});
    process.env.JWT_SECRET = "test-secret";
  });

  describe("forgotPassword", () => {
    it("returns 422 if email is missing", async () => {
      const req = { body: {}, headers: {}, socket: { remoteAddress: "127.0.0.1" } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await forgotPassword(req, res, next);
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Email is required." }));
    });

    it("returns generic success message even if user not found", async () => {
      vi.spyOn(User, "findOne").mockResolvedValue(null);
      const req = { body: { email: "nonexistent@test.com" }, headers: {}, socket: { remoteAddress: "127.0.0.1" } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await forgotPassword(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it("generates token and saves user when email exists", async () => {
      const mockSave = vi.fn().mockResolvedValue(true);
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "test@example.com",
        name: "Test User",
        save: mockSave,
      };
      vi.spyOn(User, "findOne").mockResolvedValue(mockUser);

      const req = { body: { email: "test@example.com" }, headers: {}, socket: { remoteAddress: "127.0.0.1" } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await forgotPassword(req, res, next);
      expect(mockUser.resetPasswordToken).toBeDefined();
      expect(mockUser.resetPasswordExpires).toBeDefined();
      expect(mockSave).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe("resetPassword", () => {
    it("returns 422 if token or new password is missing", async () => {
      const req = { body: { token: "tok123" }, headers: {}, socket: { remoteAddress: "127.0.0.1" } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await resetPassword(req, res, next);
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it("returns 422 if new password is too short", async () => {
      const req = { body: { token: "tok123", newPassword: "123" }, headers: {}, socket: { remoteAddress: "127.0.0.1" } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await resetPassword(req, res, next);
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "New password must be at least 8 characters long." })
      );
    });

    it("returns 400 if token is invalid or expired", async () => {
      vi.spyOn(User, "findOne").mockResolvedValue(null);
      const req = { body: { token: "invalidtoken", newPassword: "ValidPassword123!" }, headers: {}, socket: { remoteAddress: "127.0.0.1" } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await resetPassword(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Invalid or expired reset token." })
      );
    });

    it("resets password and clears reset token on success", async () => {
      const mockSave = vi.fn().mockResolvedValue(true);
      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        name: "Test User",
        resetPasswordToken: "somehash",
        resetPasswordExpires: new Date(Date.now() + 10000),
        save: mockSave,
      };
      vi.spyOn(User, "findOne").mockResolvedValue(mockUser);

      const req = {
        body: { token: "validtoken", newPassword: "NewSecurePassword123!" },
        headers: {},
        socket: { remoteAddress: "127.0.0.1" },
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await resetPassword(req, res, next);
      expect(mockUser.resetPasswordToken).toBeNull();
      expect(mockUser.resetPasswordExpires).toBeNull();
      expect(mockSave).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
