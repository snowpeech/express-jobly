process.env.NODE_ENV = "test";

const sqlForPartialUpdate = require("../../helpers/partialUpdate");
const request = require("supertest");

const app = require("../../app");
const db = require("../../db");

beforeEach(async () => {
  //delete table
  let del = await db.query(` DELETE FROM companies`);
  //create table
  let result = await db.query(
    `INSERT INTO companies (handle, name, num_employees, description, logo_url) 
    VALUES ('test handle','test name',2, 'test desc', 'test url' ) 
    RETURNING *`
  );
  console.log(result.rows);
  //create a couple entry
});

afterEach(async () => {
  let result = await db.query(`DELETE FROM companies`);
});

describe("partialUpdate()", () => {
  it("should generate a proper partial update query with just 1 field", async function () {
    // FIXME: write real tests!
    // expect(false).toEqual(true);
    let result = await db.query("SELECT * FROM companies");
    // console.log(result.rows);
    expect(result.rows).not.toBeUndefined();
  });

  it("should update just the name", async () => {
    sqlForPartialUpdate(
      "companies",
      { name: "new name", num_employees: 4 },
      "handle",
      "test handle"
    );
    let result = await db.query("SELECT * FROM companies");
    // console.log("mft", result.rows[0]);
    expect(result.name).toBe("new name");
    expect(result.num_employees).toBe(4);
    // expect(result.rows).not.toBeUndefined();
  });
});
