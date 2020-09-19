const express = require("express");
const router = new express.Router();
const ExpressError = require("../helpers/expressError");

const db = require("../db");

// const { validate } = require("jsonschema");
// const bookSchemaNew = require("../schemas/bookSchemaNew");
// const bookSchemaUpdate = require("../schemas/bookSchemaUpdate");

// const Book = require("../models/book");

router.get("/", async (req, res, next) => {
  // This should return the handle and name for all of the company objects. It should also allow for the following query string parameters
  try {
    const { search, min_employees, max_employees } = req.params;
    console.log("PARAMS::", req.params);
    console.log("s", search, "min", min_employees, "max:", max_employees);
    let getCompanies = `SELECT handle, name, num_employees, description, logo_url FROM companies`;

    if (min_employees > max_employees) {
      throw new ExpressError(
        "min employees should not be greater than max employees",
        400
      );
    }

    if (search) {
      //return filtered list of handles and names
      //LIKE %term% order by??
      getCompanies += `WHERE name LIKE %${search}% OR handle LIKE %${search}% `;
    }

    if (min_employees) {
      //add onto search query?
    }
    if (max_employees) {
      //add onto search query
    }
    //
    let results = await db.query(getCompanies);
    console.log("getCompanies", getCompanies);
    // console.log("results", results);
    // console.log(results.rows);
    return res.json({ companies: results.rows });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  //create a new company & return newly created company
});

router.get("/:handle", async (req, res, next) => {
  //return a single company by its id
});

router.patch("/:handle", async (req, res, next) => {
  //update an existing company and return updated company
});

router.delete("/:handle", async (req, res, next) => {
  //delete an existing company and return a message
});

module.exports = router;
