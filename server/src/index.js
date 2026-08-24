require("dotenv").config();
const { validateEnv } = require("./config/env");
validateEnv(); // Fail fast if required env vars are missing (#2, #23)

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet"); // #5 — security headers
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const { sanitizeInput } = require("./middleware/validate"); // #3 — input sanitization

const authRoutes = require("./routes/auth");
const claimRoutes = require("./routes/claims");
const policyRoutes = require("./routes/policies");
const clinicalDocumentRoutes = require("./routes/clinicalDocuments");
const ragRoutes = require("./routes/rag");
const appealRoutes = require("./routes/appeals");
const dashboardRoutes = require("./routes/dashboard");

const app = express();
const PORT = process.env.PORT || 5001;

// #5 — Helmet for security headers (CSP, X-Frame-Options, etc.)
app.use(helmet({
  contentSecurityPolicy: false, // React injects inline styles; disable CSP for dev
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: [process.env.CLIENT_ORIGIN || "http://127.0.0.1:5173", "http://localhost:5173"],
  credentials: true,
}));
app.use(express.json({ limit: "2mb" }));
app.use(sanitizeInput); // #3 — Strip MongoDB operators from query/body/params

// #16 — Structured logging: JSON in production, dev format locally
if (process.env.NODE_ENV === "production") {
  morgan.token("body-size", (req) => (req.headers["content-length"] || "-"));
  app.use(morgan(`:remote-addr :method :url :status :response-time ms - :body-size`, { stream: process.stdout }));
} else {
  app.use(morgan("dev"));
}

// Basic rate limiting (spec section 30). Generous limits appropriate for a
// college prototype, not production traffic shaping.
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "Too many requests. Please slow down and try again shortly." },
  })
);

app.get("/health", (req, res) => res.json({ status: "ok", service: "claimassist-server" }));

// Versioned API Router (#15)
const apiV1Router = express.Router();
apiV1Router.use("/auth", authRoutes);
apiV1Router.use("/claims", claimRoutes);
apiV1Router.use("/policies", policyRoutes);
apiV1Router.use("/clinical-documents", clinicalDocumentRoutes);
apiV1Router.use("/rag", ragRoutes);
apiV1Router.use("/appeals", appealRoutes);
apiV1Router.use("/dashboard", dashboardRoutes);

app.use("/api/v1", apiV1Router);
app.use("/api", apiV1Router); // Fallback alias for backward compatibility

app.use(notFoundHandler);
app.use(errorHandler);

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`[server] ClaimAssist AI backend running on http://localhost:${PORT}`);
  });

  // #17 — Graceful shutdown: drain connections and close DB pool on SIGTERM/SIGINT
  function gracefulShutdown(signal) {
    console.log(`\n[server] ${signal} received — shutting down gracefully...`);
    server.close(() => {
      const mongoose = require("mongoose");
      mongoose.connection.close(false).then(() => {
        console.log("[server] MongoDB connection closed.");
        process.exit(0);
      });
    });
    // Force exit after 10s if graceful shutdown hangs
    setTimeout(() => {
      console.error("[server] Forced shutdown after timeout.");
      process.exit(1);
    }, 10000);
  }
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
});
