const sqlForPartialUpdate = require("../helpers/partialUpdate");
const sqlForPost = require("../helpers/sqlForPost");
const db = require("../db");

class Job {
  static async getAll(search, min_salary, min_equity) {
    let counter = 1;
    let values = [];
    // const { search, min_salary, min_equity } = req.query;

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
    // console.log("getJobs", getJobs, "values", values);

    let results = await db.query(getJobs, values);

    return results.rows;
  }

  static async getOne(id) {
    const result = await db.query(
      `SELECT  title, salary, equity, company_handle, date_posted FROM jobs WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async create(obj) {
    let { queryStr, values } = sqlForPost(obj, "jobs");

    const result = await db.query(`${queryStr} RETURNING *`, values);

    return result.rows[0];
  }

  static async update(obj, id) {
    let { query, values } = sqlForPartialUpdate("jobs", obj, "id", id);

    const result = await db.query(`${query} RETURNING *`, values);

    return result.rows[0];
  }

  static async delete(id) {
    const result = await db.query(
      `DELETE FROM jobs WHERE id = $1 RETURNING id`,
      [id]
    );
    return result.rows[0];
  }
}

module.exports = Job;
