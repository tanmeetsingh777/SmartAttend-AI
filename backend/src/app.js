const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const classRoutes = require("./routes/classRoutes");
const studentRoutes = require("./routes/studentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const reportRoutes = require("./routes/reportRoutes");
const adminRoutes = require("./routes/adminRoutes");
const correctionRoutes = require("./routes/correctionRoutes");

const app = express();

// Body Parser for handling large webcam base64 images
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// CORS configuration
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  }),
);

// HTTP logger
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Health Check
app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "healthy", service: "SmartAttend Express Backend" });
});

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/classes", classRoutes);
app.use("/api/v1/students", studentRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/corrections", correctionRoutes);

// Error Middleware
app.use(errorHandler);

module.exports = app;
