require("dotenv").config();
const crypto = require("crypto");
const { validateEnv } = require("./config/env");
validateEnv(); // Fail fast if required env vars are missing

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const { sanitizeInput } = require("./middleware/validate");

const authRoutes = require("./routes/auth");
const claimRoutes = require("./routes/claims");
const policyRoutes = require("./routes/policies");
const clinicalDocumentRoutes = require("./routes/clinicalDocuments");
const ragRoutes = require("./routes/rag");
const appealRoutes = require("./routes/appeals");
const dashboardRoutes = require("./routes/dashboard");
const auditRoutes = require("./routes/audit");
const userRoutes = require("./routes/users");
const notificationRoutes = require("./routes/notifications");

const app = express();
const PORT = process.env.PORT || 5001;

// Request correlation ID middleware
app.use((req, res, next) => {
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
});

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === "production"
  ? [process.env.CLIENT_ORIGIN].filter(Boolean)
  : [process.env.CLIENT_ORIGIN || "http://127.0.0.1:5173", "http://localhost:5173"];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: "2mb" }));
app.use(sanitizeInput);

// Structured logging
if (process.env.NODE_ENV === "production") {
  morgan.token("body-size", (req) => (req.headers["content-length"] || "-"));
  morgan.token("request-id", (req) => req.requestId);
  app.use(morgan(`:remote-addr [:request-id] :method :url :status :response-time ms - :body-size`, { stream: process.stdout }));
} else {
  app.use(morgan("dev"));
}

// Rate limiting
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

// Versioned API Router
const apiV1Router = express.Router();
apiV1Router.use("/auth", authRoutes);
apiV1Router.use("/claims", claimRoutes);
apiV1Router.use("/policies", policyRoutes);
apiV1Router.use("/clinical-documents", clinicalDocumentRoutes);
apiV1Router.use("/rag", ragRoutes);
apiV1Router.use("/appeals", appealRoutes);
apiV1Router.use("/dashboard", dashboardRoutes);
apiV1Router.use("/audit", auditRoutes);
apiV1Router.use("/users", userRoutes);
apiV1Router.use("/notifications", notificationRoutes);

app.use("/api/v1", apiV1Router);
app.use("/api", apiV1Router);

app.use(notFoundHandler);
app.use(errorHandler);

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`[server] ClaimAssist AI backend running on http://localhost:${PORT}`);
  });

  function gracefulShutdown(signal) {
    console.log(`\n[server] ${signal} received — shutting down gracefully...`);
    server.close(() => {
      const mongoose = require("mongoose");
      mongoose.connection.close(false).then(() => {
        console.log("[server] MongoDB connection closed.");
        process.exit(0);
      });
    });
    setTimeout(() => {
      console.error("[server] Forced shutdown after timeout.");
      process.exit(1);
    }, 10000);
  }
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
});
