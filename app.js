const express = require("express");
const mysql = require("mysql2");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ===== RDS CONNECTION =====
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306
});

db.connect((err) => {
  if (err) {
    console.error("❌ DB connection failed:", err.message);
  } else {
    console.log("✅ Connected to RDS");
  }
});


// =====================
// 🔍 HEALTH ROUTES
// =====================

// ALB health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "node-aws-api"
  });
});


// =====================
// 🧪 BASIC TEST ROUTES
// =====================

app.get("/", (req, res) => {
  res.json({
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

// Test DB connection
app.get("/db-test", (req, res) => {
  db.query("SELECT NOW() AS time", (err, results) => {
    if (err) {
      return res.status(500).json({
        error: "DB error",
        details: err.message
      });
    }

    res.json({
      message: "DB connection successful",
      server_time: results[0].time
    });
  });
});


// Fetch sample data
app.get("/users", (req, res) => {
  db.query("SELECT 1 AS id, 'AWS User' AS name", (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({
      users: results
    });
  });
});


// Insert test record
app.post("/users", (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({
      error: "Name is required"
    });
  }

  db.query(
    "INSERT INTO users (name) VALUES (?)",
    [name],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          error: err.message
        });
      }

      res.json({
        message: "User created",
        id: result.insertId
      });
    }
  );
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