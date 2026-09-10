import { describe, it, expect, vi, beforeEach } from "vitest";

const AuditLog = require("../models/AuditLog");
const { listAuditLogs } = require("./auditController");

describe("auditController", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("lists audit logs with pagination", async () => {
    const mockLogs = [
      { _id: "1", action: "CLAIM_CREATED", resource: "Claim", userName: "Admin" },
      { _id: "2", action: "LOGIN_SUCCESS", resource: "User", userName: "Admin" },
    ];

    const chain = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockLogs),
    };

    vi.spyOn(AuditLog, "find").mockReturnValue(chain);
    vi.spyOn(AuditLog, "countDocuments").mockResolvedValue(2);

    const req = { query: { page: "1", limit: "20" } };
    const res = { json: vi.fn() };
    const next = vi.fn();

    await listAuditLogs(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(AuditLog.find).toHaveBeenCalledWith({});
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockLogs,
      pagination: {
        total: 2,
        page: 1,
        limit: 20,
        pages: 1,
      },
    });
  });

  it("applies action and resource filters when provided", async () => {
    const chain = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    vi.spyOn(AuditLog, "find").mockReturnValue(chain);
    vi.spyOn(AuditLog, "countDocuments").mockResolvedValue(0);

    const req = { query: { action: "CLAIM_CREATED", resource: "Claim" } };
    const res = { json: vi.fn() };
    const next = vi.fn();

    await listAuditLogs(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(AuditLog.find).toHaveBeenCalledWith({
      action: "CLAIM_CREATED",
      resource: "Claim",
    });
    expect(AuditLog.countDocuments).toHaveBeenCalledWith({
      action: "CLAIM_CREATED",
      resource: "Claim",
    });
  });
});
