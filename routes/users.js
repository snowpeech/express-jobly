const express = require("express");
const router = new express.Router();
const ExpressError = require("../helpers/expressError");

const jsonschema = require("jsonschema");
// const jobSchemaNew = require("../schemas/jobSchemaNew.json");
// const jobSchemaUpdate = require("../schemas/jobSchemaUpdate.json");

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
    const {
      username,
      password,
      first_name,
      last_name,
      email,
      photo_url,
      is_admin,
    } = req.body;
  } catch (e) {}
});

router.get("/:username", async (req, res, next) => {
  try {
  } catch (e) {}
});

router.patch("/:username", async (req, res, next) => {
  try {
  } catch (e) {}
});

router.delete("/:username", async (req, res, next) => {
  try {
  } catch (e) {}
});

module.exports = router;
