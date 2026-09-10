// Wraps an async Express handler so rejected promises are forwarded to
// errorHandler.js instead of crashing the process or hanging the request.
module.exports = function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};

