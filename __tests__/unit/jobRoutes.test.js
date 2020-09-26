process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../../app");
const db = require("../../db");

let jobId;

beforeEach(async () => {
  await db.query(
    `INSERT INTO companies (handle, name)
    VALUES
    ('test', 'test name'),
    ('big', 'big co' );`
  );
  let result = await db.query(
    `INSERT INTO jobs (title, salary, equity, company_handle, date_posted)
      VALUES
      ('chef', 65, 0.1, 'test', '2019-09-20'),
      ('tester', 65000, 0.5, 'big', '2020-05-20'),
      ('baker', 65, 0.5, 'big', '2020-09-22') 
      RETURNING id`
  );
  console.log("BEFORE EACH", result.rows);
  jobId = result.rows[0].id;
});

afterEach(async () => {
  await db.query(` DELETE FROM jobs`);
  await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
  await db.end();
});

// describe("GET jobs/", function () {
//   test("Returns all jobs data", async function () {
//     const response = await request(app).get(`/jobs`);
//     expect(response.statusCode).toBe(200);

//     expect(response.body.jobs.length).toBe(3);
//     expect(Date.parse(response.body.jobs[0].date_posted)).toBeGreaterThan(
//       Date.parse(response.body.jobs[2].date_posted)
//     );
//   });

//   test("Returns job data for search", async () => {
//     let response = await request(app).get(`/jobs?search=chef`);
//     expect(response.statusCode).toEqual(200);
//     expect(response.body.jobs.length).toBe(1);

//     response = await request(app).get(`/jobs?search=test`);
//     expect(response.statusCode).toEqual(200);

//     expect(response.body.jobs.length).toBe(2);
//   });

//   test("Returns companies matching min equity constraint", async () => {
//     const response = await request(app).get(`/jobs?min_equity=0.3`);

//     console.log("BODY", response.body);
//     expect(response.statusCode).toEqual(200);
//     expect(response.body.jobs.length).toBe(2);
//   });

//   test("Returns companies matching min salary constraint", async () => {
//     const response = await request(app).get(`/jobs?min_salary=100`);

//     console.log("BODY", response.body);
//     expect(response.statusCode).toEqual(200);
//     expect(response.body.jobs.length).toBe(1);
//   });

//   test("Returns message when no jobs found", async () => {
//     const response = await request(app).get(`/jobs?search=aloo`);
//     expect(response.statusCode).toBe(200);
//     expect(response.body.message).toBe("No jobs found");
//   });
// });

// describe("GET /jobs/:handle", function () {
//   test("Returns company data at handle", async () => {
//     const response = await request(app).get(`/jobs/${jobId}`);
//     expect(response.statusCode).toBe(200);
//     expect(response.body).toEqual({
//       job: {
//         title: "chef",
//         salary: 65,
//         equity: 0.1,
//         company_handle: "test",
//         date_posted: "2019-09-20T05:00:00.000Z",
//       },
//     });
//   });

//   test("Returns error message for nonexistent job id", async () => {
//     const response = await request(app).get(`/jobs/999`);
//     expect(response.body).toEqual({
//       message: "No job with id 999 was found",
//       status: 400,
//     });
//   });
// });

// describe("POST /jobs", function () {
//   test("Creates a job with minimum fields", async () => {
//     const response = await request(app).post(`/jobs`).send({
//       title: "artist",
//       salary: 12200,
//     });

//     expect(response.statusCode).toBe(200);
//     expect(response.body.job.title).toBe("artist");
//     expect(response.body.job.salary).toBe(12200);

//     const resp = await request(app).get(`/jobs`);
//     expect(resp.body.jobs.length).toBe(4);
//   });

//   test("Returns error message for company missing required info", async () => {
//     const response = await request(app).post(`/companies`).send({
//       salary: 12200,
//     });
//     expect(response.statusCode).toBe(400);
//     expect(response.body.message[0]).toBe(
//       'instance requires property "handle"'
//     );
//   });
// });

describe("PATCH /jobs/:id", function () {
  test("Updates a job", async () => {
    const response = await request(app).patch(`/jobs/${jobId}`).send({
      title: "tinkerbell",
      salary: 1200,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.job.salary).toEqual(1200);
    expect(response.body.job.title).toEqual("tinkerbell");
    const resp = await request(app).get(`/jobs`);

    expect(resp.body.jobs.length).toBe(3);
  });

  test("Returns message if job id not found", async () => {
    const response = await request(app).patch(`/jobs/0`).send({
      title: "text",
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("No job with id 0 was found");
  });

  test("Returns error message for passing in unacceptable update", async () => {
    const response = await request(app).patch(`/jobs/${jobId}`).send({
      salary: "aaa",
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.message[0]).toBe(
      "instance.salary is not of a type(s) integer"
    );
  });

  test("Returns error message for submitting id in body", async () => {
    const response = await request(app).patch(`/jobs/${jobId}`).send({
      id: 23,
      title: "text",
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.message[0]).toBe(
      'instance additionalProperty "id" exists in instance when not allowed'
    );
  });
});

describe("DELETE /jobs/:id", function () {
  test("Deletes a job", async () => {
    const response = await request(app).delete(`/jobs/${jobId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ message: "Job deleted" });

    const resp = await request(app).get(`/jobs`);
    expect(resp.body.jobs.length).toBe(2);
  });

  test("Returns error message for company missing required info", async () => {
    const response = await request(app).delete(`/jobs/1`);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(`No job with id 1 was found`);
  });
});
