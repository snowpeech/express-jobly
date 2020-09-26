const express = require("express");
const router = new express.Router();
const ExpressError = require("../helpers/expressError");

const jsonschema = require("jsonschema");
const jobSchemaNew = require("../schemas/jobSchemaNew.json");
const jobSchemaUpdate = require("../schemas/jobSchemaUpdate.json");

const db = require("../db");
const sqlForPartialUpdate = require("../helpers/partialUpdate");
const sqlForPost = require("../helpers/sqlForPost");
const Job = require("../models/job");

router.get("/", async (req, res, next) => {
  try {
    // This route should list all the titles and company handles for all jobs, ordered by the most recently posted jobs. It should also allow for the following query string parameters
    // return JSON of {jobs: [job, ...]}
    const { search, min_salary, min_equity } = req.query;

    let result = await Job.getAll(search, min_salary, min_equity);
    if (result.length === 0) {
      return res.json({ message: "No jobs found" });
    }

    return res.json({ jobs: result });
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

    let result = await Job.create(req.body);
    return res.json({ job: result });
  } catch (e) {
    return next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    // This route should show information about a specific job including a key of company which is an object that contains all of the information about the company associated with it.
    // It should return JSON of {job: jobData}

    let result = await Job.getOne(req.params.id);
    if (!result) {
      throw new ExpressError(`No job with id ${req.params.id} was found`, 400);
    }
    return res.json({ job: result });
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

    const result = await Job.update(req.body, req.params.id);

    if (!result) {
      throw new ExpressError(`No job with id ${req.params.id} was found`, 400);
    }

    return res.json({ job: result });
  } catch (e) {
    return next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    // delete job and return message
    // return JSON of { message: "Job deleted" }

    const result = await Job.delete(req.params.id);
    if (!result) {
      throw new ExpressError(`No job with id ${req.params.id} was found`, 400);
    }
    return res.json({ message: "Job deleted" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
