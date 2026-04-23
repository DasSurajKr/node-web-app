const mysql = require("mysql2");

// DAO (Data Access Object) - Handles all database operations
class UserDAO {
  constructor(dbConnection) {
    this.db = dbConnection;
  }

  // Get all users
  getAllUsers(callback) {
    this.db.query("SELECT 1 AS id, 'AWS User' AS name", (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results);
    });
  }

  // Get user by ID
  getUserById(userId, callback) {
    this.db.query("SELECT * FROM users WHERE id = ?", [userId], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results.length > 0 ? results[0] : null);
    });
  }

  // Create new user
  createUser(name, callback) {
    if (!name) {
      return callback(new Error("Name is required"), null);
    }

    this.db.query(
      "INSERT INTO users (name) VALUES (?)",
      [name],
      (err, result) => {
        if (err) {
          return callback(err, null);
        }
        callback(null, {
          id: result.insertId,
          name: name
        });
      }
    );
  }

  // Delete user
  deleteUser(userId, callback) {
    this.db.query("DELETE FROM users WHERE id = ?", [userId], (err, result) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, result.affectedRows > 0);
    });
  }

  // Test database connection
  testConnection(callback) {
    this.db.query("SELECT NOW() AS time", (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results[0].time);
    });
  }
}

module.exports = UserDAO;
