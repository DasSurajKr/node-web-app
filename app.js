const express = require("express");
const mysql = require("mysql2");
const UserDAO = require("./userDAO");

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

// ===== DAO INITIALIZATION =====
const userDAO = new UserDAO(db);


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
  userDAO.testConnection((err, time) => {
    if (err) {
      return res.status(500).json({
        error: "DB error",
        details: err.message
      });
    }

    res.json({
      message: "DB connection successful",
      server_time: time
    });
  });
});


// Fetch sample data
app.get("/users", (req, res) => {
  userDAO.getAllUsers((err, users) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({
      users: users
    });
  });
});


// Insert test record
app.post("/users", (req, res) => {
  const { name } = req.body;

  userDAO.createUser(name, (err, user) => {
    if (err) {
      return res.status(err.message === "Name is required" ? 400 : 500).json({
        error: err.message
      });
    }

    res.json({
      message: "User created",
      id: user.id
    });
  });
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