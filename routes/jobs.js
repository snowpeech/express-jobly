const express = require("express");
const router = new express.Router();
const ExpressError = require("../helpers/expressError");

const jsonschema = require("jsonschema");
const jobSchemaNew = require("../schemas/jobSchemaNew.json");
// const jobSchemaNew = require("../schemas/jobSchema.json");
const jobSchemaUpdate = require("../schemas/jobSchemaUpdate.json");

const db = require("../db");
const sqlForPartialUpdate = require("../helpers/partialUpdate");

router.get("/", async (req, res, next) => {
  try {
    // This route should list all the titles and company handles for all jobs, ordered by the most recently posted jobs. It should also allow for the following query string parameters
    // return JSON of {jobs: [job, ...]}
    let counter = 1;
    let values = [];
    const { search, min_salary, min_equity } = req.query;
    console.log(
      "search",
      search,
      "min_salary",
      min_salary,
      "min_equity",
      min_equity
    );
    let queryStr = "";
    if (search) {
      queryStr = ` WHERE (title LIKE $${counter} OR company_handle LIKE $${counter}) `;
      values.push(`%${search}%`);
      counter++;
    }

    if (min_salary) {
      if (search) {
        queryStr += `AND salary >= $${counter}`;
      } else {
        queryStr += ` WHERE salary >= $${counter}`;
      }
      values.push(parseFloat(min_salary));
      counter++;
    }

    if (min_equity) {
      if (search || min_salary) {
        queryStr += ` AND equity >= $${counter}`;
      } else {
        queryStr += ` WHERE equity >= $${counter}`;
      }
      values.push(parseFloat(min_equity));
    }
    let getJobs = `SELECT title, company_handle, salary, date_posted FROM jobs ${queryStr} ORDER BY date_posted DESC`;
    console.log("getJobs", getJobs, "values", values);
    let results = await db.query(getJobs, values);

    return res.json({ jobs: results.rows });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    // This route creates a new job and returns a new job.
    // It should return JSON of {job: jobData}
    // const { title, salary, equity, company_handle, date_posted } = req.body;
    const validationResult = jsonschema.validate(req.body, jobSchemaNew);
    if (!validationResult.valid) {
      let listOfErrors = validationResult.errors.map((error) => error.stack);
      let error = new ExpressError(listOfErrors, 400);
      return next(error);
    }

    let fields = [];
    let values = [];
    let idxArr = [];

    let idx = 1;
    for (let field in req.body) {
      fields.push(field);
      values.push(req.body[field]);
      idxArr.push(`$${idx}`);
      idx += 1;
    }

    let cols = fields.join(", ");
    let idxs = idxArr.join(", ");

    const result = await db.query(
      `INSERT INTO jobs (${cols}) VALUES (${idxs}) RETURNING *`,
      values
    );

    return res.json(result.rows);
  } catch (e) {
    return next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    // This route should show information about a specific job including a key of company which is an object that contains all of the information about the company associated with it.
    // It should return JSON of {job: jobData}
    const result = await db.query(
      `SELECT  title, salary, equity, company_handle, date_posted FROM jobs WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`No job with id ${req.params.id} was found`, 400);
    }
    return res.json({ job: result.rows });
  } catch (e) {
    return next(e);
  }
});

router.patch("/:id", async (req, res, next) => {
  // This route updates a job by its ID and returns an the newly updated job.
  // It should return JSON of {job: jobData}
  try {
    const validationResult = jsonschema.validate(req.body, jobSchemaUpdate);
    if (!validationResult.valid) {
      let listOfErrors = validationResult.errors.map((error) => error.stack);
      let error = new ExpressError(listOfErrors, 400);
      return next(error);
    }

    let { query, values } = sqlForPartialUpdate(
      "jobs",
      req.body,
      "id",
      req.params.id
    );

    const result = await db.query(query, values);
    return res.json({ job: result.rows });
  } catch (e) {
    return next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    // delete job and return message
    // return JSON of { message: "Job deleted" }
    const result = await db.query(
      `DELETE FROM jobs WHERE id = $1 RETURNING id`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`No job with id ${req.params.id} was found`, 400);
    }
    return res.json({ message: "Job deleted" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
