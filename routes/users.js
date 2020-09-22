const express = require("express");
const router = new express.Router();
const ExpressError = require("../helpers/expressError");

const jsonschema = require("jsonschema");
// const companySchemaNew = require("../schemas/companySchemaNew.json");
// const companySchemaUpdate = require("../schemas/companySchemaUpdate.json");

const db = require("../db");
module.exports = router;
