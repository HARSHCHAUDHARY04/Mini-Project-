// #3 — Lightweight input validation and sanitization.
// Prevents NoSQL injection in query params and validates request bodies
// without pulling in a heavy schema library (Joi/Zod).

// Sanitize a value to prevent MongoDB operator injection ($gt, $ne, etc.).
// Strips any key starting with "$" from objects, recursively.
function sanitize(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map(sanitize);
  if (typeof value === "object") {
    const clean = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith("$")) continue; // strip MongoDB operators
      clean[k] = sanitize(v);
    }
    return clean;
  }
  return value;
}

// Express middleware: sanitize req.body, req.query, and req.params
function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitize(req.body);
  }
  if (req.query && typeof req.query === "object") {
    req.query = sanitize(req.query);
  }
  if (req.params && typeof req.params === "object") {
    req.params = sanitize(req.params);
  }
  next();
}

// Simple field-level validator factory for common patterns.
// Returns an Express middleware that validates req.body against rules.
function validateBody(rules) {
  return (req, res, next) => {
    const errors = [];
    for (const { field, required, type, maxLength, pattern, message } of rules) {
      const val = req.body?.[field];
      if (required && (val === undefined || val === null || val === "")) {
        errors.push(message || `${field} is required.`);
        continue;
      }
      if (val !== undefined && val !== null && val !== "") {
        if (type === "string" && typeof val !== "string") {
          errors.push(`${field} must be a string.`);
        }
        if (type === "number" && typeof val !== "number" && isNaN(Number(val))) {
          errors.push(`${field} must be a number.`);
        }
        if (type === "email" && typeof val === "string") {
          const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRe.test(val)) {
            errors.push(`${field} must be a valid email address.`);
          }
        }
        if (maxLength && typeof val === "string" && val.length > maxLength) {
          errors.push(`${field} must be at most ${maxLength} characters.`);
        }
        if (pattern && typeof val === "string" && !pattern.test(val)) {
          errors.push(message || `${field} has an invalid format.`);
        }
      }
    }
    if (errors.length > 0) {
      return res.status(422).json({ success: false, error: errors.join(" ") });
    }
    next();
  };
}

module.exports = { sanitize, sanitizeInput, validateBody };
