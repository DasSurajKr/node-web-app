const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const DAO_SERVICE_URL = process.env.DAO_SERVICE_URL || "http://localhost:3001";


// =====================
// 🔍 HEALTH ROUTES
// =====================

// ALB health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "200",
    app: "UP",
    service: "node-aws-api"
  });
});


// =====================
// 🧪 BASIC TEST ROUTES
// =====================

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Node.js AWS API is running 🚀",
    version: "1.0.0"
  });
});

app.get("/ping", (req, res) => {
  res.send("pong");
});


// =====================
// 🗄️ DATABASE ROUTES
// =====================

// Test DB connection via DAO service
app.get("/db-test", async (req, res) => {
  try {
    const response = await axios.get(`${DAO_SERVICE_URL}/db-status`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "DAO service error",
      details: error.message
    });
  }
});


// Fetch sample data from DAO service
app.get("/users", async (req, res) => {
  try {
    const response = await axios.get(`${DAO_SERVICE_URL}/users`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch users",
      details: error.message
    });
  }
});


// Insert test record via DAO service
app.post("/users", async (req, res) => {
  const { name } = req.body;

  try {
    const response = await axios.post(`${DAO_SERVICE_URL}/users`, { name });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || error.message
    });
  }
});


// =====================
// 🧠 SYSTEM ROUTES
// =====================

app.get("/info", (req, res) => {
  res.json({
    hostname: require("os").hostname(),
    platform: process.platform,
    uptime: process.uptime()
  });
});


// =====================
// 🚀 START SERVER
// =====================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});