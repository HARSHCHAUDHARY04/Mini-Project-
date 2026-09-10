import { describe, it, expect, vi, beforeEach } from "vitest";
const jwt = require("jsonwebtoken");
const { requireAuth, requireRole } = require("./auth");

describe("requireAuth middleware", () => {
  const secret = "test-jwt-secret-key-123456";

  beforeEach(() => {
    process.env.JWT_SECRET = secret;
  });

  it("returns 401 when Authorization header is missing", () => {
    const req = { headers: {} };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Authentication required." });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when token is invalid", () => {
    const req = { headers: { authorization: "Bearer invalid.jwt.token" } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Invalid or expired token." });
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches decoded user payload and calls next() with valid token", () => {
    const userPayload = { id: "user123", role: "admin", name: "Dr. Demo", email: "admin@demo.com" };
    const token = jwt.sign(userPayload, secret);

    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    requireAuth(req, res, next);
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe("user123");
    expect(req.user.role).toBe("admin");
    expect(next).toHaveBeenCalled();
  });
});

describe("requireRole middleware", () => {
  it("allows access when user role matches allowed roles", () => {
    const middleware = requireRole("admin");
    const req = { user: { id: "1", role: "admin" } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 403 when user role is not permitted", () => {
    const middleware = requireRole("admin");
    const req = { user: { id: "2", role: "reviewer" } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "You do not have permission to perform this action.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("allows access if user matches any of multiple roles", () => {
    const middleware = requireRole("admin", "reviewer");
    const req = { user: { id: "3", role: "reviewer" } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
