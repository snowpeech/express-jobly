const express = require("express");
const router = new express.Router();
const ExpressError = require("../helpers/expressError");

const jsonschema = require("jsonschema");
const userSchemaNew = require("../schemas/userSchemaNew.json");
const userSchemaUpdate = require("../schemas/userSchemaUpdate.json");

const db = require("../db");
const sqlForPartialUpdate = require("../helpers/partialUpdate");
const sqlForPost = require("../helpers/sqlForPost");

router.get("/", async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT username, first_name, last_name, email FROM users`
    );
    return res.json({ users: result.rows });
  } catch (e) {}
});

router.post("/", async (req, res, next) => {
  try {
    const validationResult = jsonschema.validate(req.body, userSchemaNew);
    if (!validationResult.valid) {
      let listOfErrors = validationResult.errors.map((error) => error.stack);
      let error = new ExpressError(listOfErrors, 400);
      return next(error);
    }

    let { queryStr, values } = sqlForPost(req.body, "users");
    const result = await db.query(queryStr, values);
    return res.json(result.rows[0]);
  } catch (e) {
    return next(e);
  }
});

router.get("/:username", async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT username, first_name, last_name, email, photo_url FROM users WHERE username = $1`,
      [req.params.username]
    );
    if (results.rows.length === 0) {
      return res.json({ message: `${req.params.username} not found` });
    }
    return res.json({ user: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.patch("/:username", async (req, res, next) => {
  try {
    const validationResult = jsonschema.validate(req.body, userSchemaUpdate);

    if (!validationResult.valid) {
      let listOfErrors = validationResult.errors.map((error) => error.stack);
      let error = new ExpressError(listOfErrors, 400);
      return next(error);
    }
    let { query, values } = sqlForPartialUpdate(
      "users",
      req.body,
      "username",
      req.params.username
    );
    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return res.json({ message: `${req.params.username} not found` });
    }
    return res.json({ user: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.delete("/:username", async (req, res, next) => {
  try {
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
