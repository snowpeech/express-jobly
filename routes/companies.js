const express = require("express");
const router = new express.Router();
const ExpressError = require("../helpers/expressError");

const jsonschema = require("jsonschema");
const companySchemaNew = require("../schemas/companySchemaNew.json");
const companySchemaUpdate = require("../schemas/companySchemaUpdate.json");
const sqlForPartialUpdate = require("../helpers/partialUpdate");

const Company = require("../models/company");

const db = require("../db");

// const Book = require("../models/book");

router.get("/", async (req, res, next) => {
  // This should return the handle and name for all of the company objects. It should also allow for the following query string parameters
  try {
    const { search, min_employees, max_employees } = req.query;

    let result = await Company.getAll(search, min_employees, max_employees);

    return res.json({ companies: result });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  //create a new company & return newly created company
  try {
    const validationResult = jsonschema.validate(req.body, companySchemaNew);
    if (!validationResult.valid) {
      let listOfErrors = validationResult.errors.map((error) => error.stack);
      let error = new ExpressError(listOfErrors, 400);
      return next(error);
    }
    const { handle, name, num_employees, description, logo_url } = req.body;
    const result = await Company.create(
      handle,
      name,
      num_employees,
      description,
      logo_url
    );

    return res.json({ company: result });
  } catch (e) {
    return next(e);
  }
});

router.get("/:handle", async (req, res, next) => {
  //return a single company by its id
  try {
    const { handle } = req.params;
    let result = await Company.getOne(handle);

    return res.json({ company: result });
  } catch (e) {
    return next(e);
  }
});

router.patch("/:handle", async (req, res, next) => {
  //update an existing company and return updated company
  // for every value passed in, create an array.
  try {
    const validationResult = jsonschema.validate(req.body, companySchemaUpdate);
    if (!validationResult.valid) {
      let listOfErrors = validationResult.errors.map((error) => error.stack);
      let error = new ExpressError(listOfErrors, 400);
      return next(error);
    }

    let { query, values } = sqlForPartialUpdate(
      "companies",
      req.body,
      "handle",
      req.params.handle
    );

    const result = await db.query(query, values);
    return res.json({ company: result.rows });
  } catch (e) {
    return next(e);
  }
});

router.delete("/:handle", async (req, res, next) => {
  //delete an existing company and return a message
  try {
    const result = await db.query(
      `DELETE FROM companies WHERE handle = $1 RETURNING name`,
      [req.params.handle]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`No company with handle ${handle} was found`, 400);
    }
    return res.json({ message: "Company deleted" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
