// Centralized error handler (spec section 24): user-friendly messages only,
// never raw stack traces to the frontend. Full detail is logged server-side.
function errorHandler(err, req, res, next) {
  console.error(`[error] ${req.method} ${req.originalUrl}:`, err.message);
  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack);
  }

  let status = err.status || err.statusCode || 500;
  let message = err.userMessage || "Something went wrong. Please try again.";

  // multer file-size/type errors (spec section 24: "Invalid PDF", "Unsupported file",
  // file-size limits) — translate to a friendly, correctly-statused response instead
  // of falling through to a generic 500.
  if (err.name === "MulterError") {
    status = 422;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File is too large. Maximum upload size is 15MB.";
    } else {
      message = `File upload error: ${err.message}`;
    }
  } else if (status === 422 && err.message) {
    // Errors we deliberately threw with a status (e.g. unsupported file type
    // from fileFilter) already carry a safe, user-facing message.
    message = err.message;
  } else if (err.code === "ECONNREFUSED") {
    status = 503;
    message = "The AI analysis service is currently unavailable. Please make sure it is running and try again.";
  } else if (err.response && err.response.data && err.response.data.detail) {
    // Errors forwarded from the AI service (see aiServiceClient.js) already
    // carry a safe, user-facing `detail` message and the correct status.
    message = err.response.data.detail;
  } else if (err.name === "ValidationError") {
    // Mongoose schema validation errors
    status = 422;
    message = Object.values(err.errors || {})
      .map((e) => e.message)
      .join(" ") || "Validation failed.";
  } else if (err.name === "CastError") {
    status = 422;
    message = `Invalid value for "${err.path}".`;
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `A record with this ${field} already exists.` : "Duplicate record.";
  }

  res.status(status).json({ success: false, error: message });
}

function notFoundHandler(req, res) {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFoundHandler };
