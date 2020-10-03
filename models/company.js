const sqlForPartialUpdate = require("../helpers/partialUpdate");
const ExpressError = require("../helpers/expressError");

const db = require("../db");

class Company {
  static async getAll(search, min_employees, max_employees) {
    let counter = 1;
    let values = [];

    let getCompanies = `SELECT handle, name, num_employees, description, logo_url FROM companies`;

    if (parseInt(max_employees) < parseInt(min_employees)) {
      throw new ExpressError(
        "min employees should not be greater than max employees",
        400
      );
    }

    if (search) {
      getCompanies += ` WHERE (name LIKE $${counter} OR handle LIKE $${counter}) `;
      values.push(`%${search}%`);
      counter++;
    }

    if (min_employees) {
      if (search) {
        getCompanies += `AND num_employees >= $${counter}`;
      } else {
        getCompanies += ` WHERE num_employees >= $${counter}`;
      }
      values.push(parseInt(min_employees));
      counter++;
    }

    if (max_employees) {
      if (search || min_employees) {
        getCompanies += ` AND num_employees <= $${counter}`;
      } else {
        getCompanies += ` WHERE num_employees <= $${counter}`;
      }
      values.push(parseInt(max_employees));
    }

    let results = await db.query(getCompanies, values);

    return results.rows;
  }

  static async getOne(handle) {
    const coRes = await db.query(
      `SELECT handle, name, num_employees, description, logo_url FROM companies WHERE handle = $1`,
      [handle]
    );
    if (coRes.rows.length === 0) {
      throw new ExpressError(`No company with handle ${handle} was found`, 400);
    }
    const company = coRes.rows[0];
    const jobRes = await db.query(
      `SELECT  id, title, salary, equity, date_posted FROM jobs WHERE company_handle = $1`,
      [handle]
    );
    company.jobs = jobRes.rows;
    return company;
  }

  static async create(handle, name, num_employees, description, logo_url) {
    const results = await db.query(
      `INSERT INTO companies (handle, name, num_employees, description, logo_url) VALUES ($1, $2, $3, $4, $5) RETURNING handle, name, num_employees, description, logo_url`,
      [handle, name, num_employees, description, logo_url]
    );
    return results.rows[0];
  }

  static async update(newInfo, id) {
    let { query, values } = sqlForPartialUpdate(
      "companies",
      newInfo,
      "handle",
      id
    );

    const result = await db.query(`${query} RETURNING *`, values);
    return result.rows[0];
  }

  static async delete(handle) {
    const result = await db.query(
      `DELETE FROM companies WHERE handle = $1 RETURNING name`,
      [handle]
    );
    return result;
  }
}

module.exports = Company;
