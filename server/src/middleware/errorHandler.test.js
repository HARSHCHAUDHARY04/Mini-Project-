import { describe, it, expect, vi } from "vitest";
const { errorHandler, notFoundHandler } = require("./errorHandler");

describe("errorHandler", () => {
  it("translates Multer LIMIT_FILE_SIZE error to 422", () => {
    const err = new Error("File too large");
    err.name = "MulterError";
    err.code = "LIMIT_FILE_SIZE";

    const req = { method: "POST", originalUrl: "/claims/upload" };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "File is too large. Maximum upload size is 15MB.",
    });
  });

  it("translates ECONNREFUSED to 503 service unavailable", () => {
    const err = new Error("Connection refused");
    err.code = "ECONNREFUSED";

    const req = { method: "POST", originalUrl: "/claims/CLM-1/analyze" };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(503);
  });
});

describe("notFoundHandler", () => {
  it("returns 404 for unknown route", () => {
    const req = { method: "GET", originalUrl: "/api/non-existent" };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    notFoundHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
