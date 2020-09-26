const sqlForPartialUpdate = require("../helpers/partialUpdate");
const sqlForPost = require("../helpers/sqlForPost");
const ExpressError = require("../helpers/expressError");

const db = require("../db");

class User {
  static async getAll() {
    const result = await db.query(
      `SELECT username, first_name, last_name, email FROM users`
    );
    return result.rows;
  }
  static async getOne(username) {
    const result = await db.query(
      `SELECT username, first_name, last_name, email, photo_url FROM users WHERE username = $1`,
      [username]
    );
    return result.rows[0];
  }
  static async update(username, obj) {
    let { query, values } = sqlForPartialUpdate(
      "users",
      obj,
      "username",
      username
    );
    const result = await db.query(query, values);
    return result.rows[0];
  }
  static async register(obj) {
    let { queryStr, values } = sqlForPost(obj, "users");
    const result = await db.query(
      `${queryStr} RETURNING username, first_name, last_name, email`,
      values
    );
    return result.rows[0];
  }
  static async login() {}
  static async delete(username) {
    const result = await db.query(
      `DELETE FROM users WHERE username = $1 RETURNING username`,
      [username]
    );
    return result.rows[0];
  }
}

module.exports = User;
