const multer = require("multer");
const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "..", "..", "storage", "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_EXTENSIONS = new Set([".pdf", ".txt", ".csv", ".json"]);
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB, generous for a demo prototype

// #4 — Validate both file extension AND MIME type to prevent bypasses.
// Extension-only checks are easily circumvented by renaming a file.
const ALLOWED_MIMES = new Set([
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/json",
  "application/vnd.ms-excel", // some systems send .csv as this
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safeBase = path.basename(file.originalname).replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, `${Date.now()}-${safeBase}`);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    const err = new Error(`Unsupported file type "${ext || "unknown"}". Allowed types: PDF, TXT, CSV, JSON.`);
    err.status = 422;
    return cb(err);
  }
  // #4 — Check MIME type alongside extension
  if (!ALLOWED_MIMES.has(file.mimetype)) {
    const err = new Error(
      `File MIME type "${file.mimetype}" does not match allowed types. ` +
      `Ensure the file is a valid PDF, TXT, CSV, or JSON document.`
    );
    err.status = 422;
    return cb(err);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

module.exports = { upload, UPLOAD_DIR };
