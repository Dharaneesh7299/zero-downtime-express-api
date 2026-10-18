
const express = require("express");
const cors = require("cors");

const reservationRoutes = require("./routes/reservationRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    service: "inventory-service",
    status: "healthy",
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Inventory and reservation routes
app.use("/api", reservationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error("Request error:", err.message);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    error: "Internal server error",
  });
});

module.exports = app;
