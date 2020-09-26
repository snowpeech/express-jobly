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
  static async getOne() {}
  static async update() {}
  static async register() {}
  static async login() {}
  static async delete() {}
}

module.exports = User;
