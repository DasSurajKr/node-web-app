const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

// Health check (VERY IMPORTANT for ALB)
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Sample API route
app.get("/", (req, res) => {
  res.json({
    message: "Node.js app running on AWS EC2 ASG 🚀",
    timestamp: new Date()
  });
});

// Example API endpoint
app.get("/api/data", (req, res) => {
  res.json({
    service: "node-service",
    data: [1, 2, 3, 4]
  });
});

// Listen on all interfaces (important for EC2)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});