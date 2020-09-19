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
  it("should generate a proper partial update query for 2 fields", async () => {
    const { query, values } = sqlForPartialUpdate(
      "companies",
      { name: "new name", num_employees: 4 },
      "handle",
      "test handle"
    );
    // let result = await db.query("SELECT * FROM companies");
    console.log("q", query, "v", values);
    expect(query).toBe(
      "UPDATE companies SET name=$1, num_employees=$2 WHERE handle=$3 RETURNING *"
    );
    expect(values[0]).toBe("new name");
    expect(values[1]).toBe(4);
    expect(values[2]).toBe("test handle");
  });
});

afterAll(async function () {
  await db.end();
});
