const express = require("express");
const router = new express.Router();
const ExpressError = require("../helpers/expressError");

const jsonschema = require("jsonschema");
const userSchemaNew = require("../schemas/userSchemaNew.json");
const userSchemaUpdate = require("../schemas/userSchemaUpdate.json");

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

    return res.json({ user: result });
  } catch (e) {
    return next(e);
  }
});

router.delete("/:username", async (req, res, next) => {
  try {
    const result = await User.delete(req.params.username);

    return res.json({ message: "User deleted" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
