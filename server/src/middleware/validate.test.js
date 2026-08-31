import { describe, it, expect, vi } from "vitest";
const { sanitize, sanitizeInput, validateBody } = require("./validate");

describe("sanitize", () => {
  it("strips keys starting with $ to prevent NoSQL injection", () => {
    const malicious = { email: "admin@demo.com", password: { $ne: null } };
    const clean = sanitize(malicious);
    expect(clean).toEqual({ email: "admin@demo.com", password: {} });
  });

  it("handles arrays and nested objects", () => {
    const input = { items: [{ $gt: 10 }, "normal"] };
    const clean = sanitize(input);
    expect(clean).toEqual({ items: [{}, "normal"] });
  });
});

describe("sanitizeInput middleware", () => {
  it("sanitizes req.body, req.query, and req.params", () => {
    const req = {
      body: { name: "test", $where: "1==1" },
      query: { q: "abc", $gt: 0 },
      params: { id: "123" },
    };
    const next = vi.fn();
    sanitizeInput(req, {}, next);

    expect(req.body).toEqual({ name: "test" });
    expect(req.query).toEqual({ q: "abc" });
    expect(req.params).toEqual({ id: "123" });
    expect(next).toHaveBeenCalled();
  });
});

describe("validateBody", () => {
  it("validates required fields", () => {
    const middleware = validateBody([{ field: "email", required: true, type: "email" }]);
    const req = { body: {} };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(next).not.toHaveBeenCalled();
  });
});
