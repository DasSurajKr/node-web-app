const express = require("express");
const mysql = require("mysql2");

const app = express();
app.use(express.json());

const DAO_PORT = process.env.DAO_PORT || 3001;

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
    console.log("✅ DAO Service connected to RDS");
  }
});

// =====================
// 🔍 HEALTH CHECK
// =====================

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "dao-service",
    db: db.state === "authenticated" ? "connected" : "disconnected"
  });
});

// =====================
// 👤 USER DAO ENDPOINTS
// =====================

// Get all users
app.get("/users", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ users: results });
  });
});

// Get user by ID
app.get("/users/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM users WHERE id = ?", [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ user: results.length > 0 ? results[0] : null });
  });
});

// Create user
app.post("/users", (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  db.query("INSERT INTO users (name) VALUES (?)", [name], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(201).json({
      message: "User created",
      id: result.insertId,
      name: name
    });
  });
});

// Delete user
app.delete("/users/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM users WHERE id = ?", [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({
      message: result.affectedRows > 0 ? "User deleted" : "User not found",
      affectedRows: result.affectedRows
    });
  });
});

// Test DB connection
app.get("/db-status", (req, res) => {
  db.query("SELECT NOW() AS time", (err, results) => {
    if (err) {
      return res.status(500).json({
        error: "DB error",
        details: err.message
      });
    }

    res.json({
      message: "DB connection successful",
      server_time: results[0].time,
      status: "UP"
    });
  });
});

// =====================
// 🚀 START DAO SERVICE
// =====================

app.listen(DAO_PORT, "0.0.0.0", () => {
  console.log(`🚀 DAO Service running on port ${DAO_PORT}`);
  console.log(`📡 API endpoints available at http://0.0.0.0:${DAO_PORT}`);
});
