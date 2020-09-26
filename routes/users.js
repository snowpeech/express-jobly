const express = require("express");
const router = new express.Router();
const ExpressError = require("../helpers/expressError");

const jsonschema = require("jsonschema");
const userSchemaNew = require("../schemas/userSchemaNew.json");
const userSchemaUpdate = require("../schemas/userSchemaUpdate.json");

const db = require("../db");
const sqlForPartialUpdate = require("../helpers/partialUpdate");
const sqlForPost = require("../helpers/sqlForPost");
const User = require("../models/user");

router.get("/", async (req, res, next) => {
  try {
    // const result = await db.query(
    //   `SELECT username, first_name, last_name, email FROM users`
    // );
    const result = await User.getAll();
    return res.json({ users: result });
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
    const result = await User.register(req.body);
    return res.json(result);
  } catch (e) {
    return next(e);
  }
});

router.get("/:username", async (req, res, next) => {
  try {
    const result = await User.getOne(req.params.username);
    if (!result) {
      throw new ExpressError(`${req.params.username} not found`, 400);
    }
    return res.json({ user: result });
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

    const result = await User.update(req.params.username, req.body);
    // let { query, values } = sqlForPartialUpdate(
    //   "users",
    //   req.body,
    //   "username",
    //   req.params.username
    // );
    // const result = await db.query(query, values);
    if (!result) {
      return res.json({ message: `${req.params.username} not found` });
    }
    return res.json({ user: result });
  } catch (e) {
    return next(e);
  }
});

router.delete("/:username", async (req, res, next) => {
  try {
    // const result = await db.query(
    //   `DELETE FROM users WHERE username = $1 RETURNING username`,
    //   [req.params.username]
    // );
    const result = await User.delete(req.params.username);
    if (!result) {
      throw new ExpressError(`${req.params.username} not found`, 400);
    }
    return res.json({ message: "User deleted" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
