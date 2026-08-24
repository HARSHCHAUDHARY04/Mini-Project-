// Validates required environment variables at startup so the server fails
// fast with a clear message instead of cryptic runtime errors later.
// Covers improvement items #2 (JWT secret fallback) and #23 (env validation).

const REQUIRED_VARS = [
  { key: "JWT_SECRET", hint: "Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"" },
  { key: "MONGO_URI", hint: "Set to your MongoDB connection string, e.g. mongodb://127.0.0.1:27017/claimassist" },
];

const OPTIONAL_VARS = [
  { key: "PORT", fallback: "5001" },
  { key: "AI_SERVICE_URL", fallback: "http://127.0.0.1:8000" },
  { key: "CLIENT_ORIGIN", fallback: "http://127.0.0.1:5173" },
  { key: "NODE_ENV", fallback: "development" },
];

function validateEnv() {
  const missing = [];
  for (const { key, hint } of REQUIRED_VARS) {
    if (!process.env[key] || process.env[key].trim() === "") {
      missing.push(`  • ${key} — ${hint}`);
    }
  }
  // JWT_SECRET must not be the default placeholder from .env.example
  if (
    process.env.JWT_SECRET === "replace-this-with-a-long-random-string" &&
    process.env.NODE_ENV === "production"
  ) {
    missing.push("  • JWT_SECRET — You are running in production with the placeholder secret. Generate a real one.");
  }

  if (missing.length > 0) {
    console.error("\n[env] Missing or invalid required environment variables:\n" + missing.join("\n"));
    console.error("\nSet them in server/.env or as environment variables. See README.md §6.2.\n");
    process.exit(1);
  }

  // Log warnings for optional vars falling back to defaults
  for (const { key, fallback } of OPTIONAL_VARS) {
    if (!process.env[key]) {
      process.env[key] = fallback;
    }
  }
}

module.exports = { validateEnv };
