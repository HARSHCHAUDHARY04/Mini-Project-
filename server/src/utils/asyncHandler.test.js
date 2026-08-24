const asyncHandler = require("./asyncHandler");

describe("asyncHandler", () => {
  it("should wrap an async function and execute it", async () => {
    const fn = jest.fn().mockResolvedValue("success");
    const next = jest.fn();
    const req = {};
    const res = {};

    const wrapped = asyncHandler(fn);
    await wrapped(req, res, next);

    expect(fn).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it("should catch errors and pass them to next", async () => {
    const error = new Error("Async failure");
    const fn = jest.fn().mockRejectedValue(error);
    const next = jest.fn();
    const req = {};
    const res = {};

    const wrapped = asyncHandler(fn);
    await wrapped(req, res, next);

    expect(fn).toHaveBeenCalledWith(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});
