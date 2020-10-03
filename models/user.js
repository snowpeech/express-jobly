const sqlForPartialUpdate = require("../helpers/partialUpdate");
const sqlForPost = require("../helpers/sqlForPost");
const ExpressError = require("../helpers/expressError");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require("../config");

class User {
  static async register(obj) {
    let { password } = obj;
    let hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    obj["password"] = hashedPassword;
    // console.log("!!!!!!!", obj);
    let { queryStr, values } = sqlForPost(obj, "users");

    const result = await db.query(
      `${queryStr} RETURNING username, is_admin`,
      values
    );

    const { username, is_admin } = result.rows[0];
    let user = { username, is_admin };
    let token = jwt.sign({ user }, SECRET_KEY);

    // console.log(result.rows[0]);
    return token;
  }

  static async login(username, password) {
    const result = await db.query(
      `SELECT username, password, first_name, last_name, email, photo_url, is_admin FROM users WHERE username = $1`,
      [username]
    );
    let user = result.rows[0];
    console.log("FROM USER MODEL:::", user);

    if (user && (await bcrypt.compare(password, user.password))) {
      let { username, is_admin } = user;
      user = { username, is_admin }; //removed password from user object
      console.log("FROM USER MODEL LOGIN NO PASSWORD:::", user);
      let token = jwt.sign({ user }, SECRET_KEY); //remove password from here after login

      return token;
    } else {
      throw new ExpressError("Wrong password/username", 400);
    }
  }

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
    if (!result.rows[0]) {
      throw new ExpressError(`${username} not found`, 404);
    }
    return result.rows[0];
  }
  static async update(username, obj) {
    let { query, values } = sqlForPartialUpdate(
      "users",
      obj,
      "username",
      username
    );
    const result = await db.query(
      `${query} RETURNING  username, first_name, last_name, email, photo_url, is_admin`,
      values
    );
    if (!result.rows[0]) {
      throw new ExpressError(`${username} not found`, 404);
    }
    return result.rows[0];
  }

  static async delete(username) {
    const result = await db.query(
      `DELETE FROM users WHERE username = $1 RETURNING username`,
      [username]
    );
    if (!result.rows[0]) {
      throw new ExpressError(`${username} not found`, 404);
    }
    return result.rows[0];
  }
}

module.exports = User;
