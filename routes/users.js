const express = require("express");
const router = new express.Router();
const ExpressError = require("../helpers/expressError");
const jsonschema = require("jsonschema");
const userSchemaNew = require("../schemas/userSchemaNew.json");
const userSchemaUpdate = require("../schemas/userSchemaUpdate.json");

const { ensureCorrectUser } = require("../middleware/auth");

const User = require("../models/user");

router.get("/", async (req, res, next) => {
  try {
    const result = await User.getAll();
    return res.json({ users: result });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  // creates/registers a new user and returns a token
  try {
    const validationResult = jsonschema.validate(req.body, userSchemaNew);

    if (!validationResult.valid) {
      let listOfErrors = validationResult.errors.map((error) => error.stack);
      let error = new ExpressError(listOfErrors, 400);
      return next(error);
    }

    const token = await User.register(req.body); //register will return username & is_admin in signed token

    return res.json({ _token: token });
  } catch (e) {
    return next(e);
  }
});

router.post("/login", async (req, res, next) => {
  // logs in a user and returns a token
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new ExpressError("Username and password required", 400);
    }
    const result = await User.login(username, password); //returns token

    return res.json({ message: "Logged in!", _token: result });
  } catch (e) {
    return next(e);
  }
});

router.get("/:username", async (req, res, next) => {
  try {
    const result = await User.getOne(req.params.username);

    return res.json({ user: result });
  } catch (e) {
    return next(e);
  }
});

router.patch("/:username", ensureCorrectUser, async (req, res, next) => {
  try {
    const validationResult = jsonschema.validate(req.body, userSchemaUpdate);

    if (!validationResult.valid) {
      let listOfErrors = validationResult.errors.map((error) => error.stack);
      let error = new ExpressError(listOfErrors, 400);
      return next(error);
    }

    const result = await User.update(req.params.username, req.body);

    return res.json({ user: result });
  } catch (e) {
    return next(e);
  }
});

router.delete("/:username", ensureCorrectUser, async (req, res, next) => {
  try {
    const result = await User.delete(req.params.username);

    return res.json({ message: "User deleted" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
