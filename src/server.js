require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

let prisma;
try {
  prisma = require('./config/database');
} catch (error) {
  console.error('Database connection error:', error.message);
}

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const projectRoutes = require("./routes/projects");
const taskRoutes = require("./routes/tasks");
const skillRoutes = require("./routes/skills");
const categoryRoutes = require("./routes/categories");

const app = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/admin/skills", skillRoutes);
app.use("/api/admin/categories", categoryRoutes);

// Health check
app.get("/api/health", async (req, res) => {
  try {
    if (prisma) {
      await prisma.$connect();
    }
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      message: "Server is running healthy",
      database: prisma ? "Connected" : "Not configured"
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      message: "Database connection failed",
      error: error.message
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 5000;

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
