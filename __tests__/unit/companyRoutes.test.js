process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../../app");
const db = require("../../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../../config");

const BCRYPT_WORK_FACTOR = 1;

let testUserToken;
let adminUserToken;

// const router = new express.Router();
// const ExpressError = require("../helpers/expressError");
beforeAll(async () => {
  const hashedPassword = await bcrypt.hash("secret123", BCRYPT_WORK_FACTOR);
  await db.query(
    `INSERT INTO users 
        (username, password, first_name, last_name, email,is_admin)
        VALUES
        ('admin', '${hashedPassword}', 'Kona', 'K', 'kona@gmail.com',true),
        ('user', '${hashedPassword}', 'Sushi', 'S', 'sushi@gmail.com',false)`
  );
  const testAdmin = { username: "admin", is_admin: true };
  const testUser = { username: "user", is_admin: false };
  userToken = jwt.sign(testUser, SECRET_KEY);
  adminToken = jwt.sign(testAdmin, SECRET_KEY);
});

beforeEach(async () => {
  await db.query(
    `INSERT INTO companies (handle, name, num_employees, description, logo_url)
      VALUES
      ('test', 'test name', 50, 'test description', 'http://logo.url' ),
      ('big', 'big co', 500, 'test description', 'http://logo.url' ),
      ('small', 'small co', 5, 'test description', 'http://logo.url' ),
      ('coalas', 'coalas', 50, 'test description', 'http://logo.url' );`
  );
  await db.query(
    `INSERT INTO jobs (title, salary, company_handle)
      VALUES
      ('chef', 65000,  'test'),
      ('baker', 65000,  'test') 
      `
  );
});

afterEach(async () => {
  await db.query(`DELETE FROM jobs`);
  await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
  await db.query(`DELETE FROM users`);
  await db.end();
});

describe("GET companies/", function () {
  test("Returns all companies data with token", async function () {
    const response = await request(app)
      .get(`/companies`)
      .send({ _token: userToken });
    expect(response.statusCode).toBe(200);
    expect(response.body.companies.length).toBe(4);
  });

  test("Returns no companies without token", async function () {
    const response = await request(app).get(`/companies`);
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Unauthorized");
  });

  test("Returns company data for search", async () => {
    const response = await request(app)
      .get(`/companies?search=co`)
      .send({ _token: userToken });
    expect(response.statusCode).toEqual(200);
    expect(response.body.companies.length).toBe(3);
  });

  test("Returns companies matching search, number of employees constraints", async () => {
    const response = await request(app)
      .get(`/companies?search=co&min_employees=10&max_employees=500`)
      .send({ _token: userToken });
    expect(response.statusCode).toEqual(200);
    expect(response.body.companies.length).toBe(2);
  });

  test("Returns error when min companies > max companies", async () => {
    const response = await request(app)
      .get(`/companies?search=co&min_employees=1000&max_employees=500`)
      .send({ _token: userToken });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      "min employees should not be greater than max employees"
    );
  });
});

describe("GET /companies/:handle", function () {
  test("Returns company data at handle", async () => {
    const response = await request(app)
      .get(`/companies/test`)
      .send({ _token: userToken });
    expect(response.statusCode).toBe(200);
    expect(response.body.company.handle).toBe("test");
    expect(response.body.company.name).toBe("test name");
    expect(response.body.company.num_employees).toBe(50);
    expect(response.body.company.description).toBe("test description");
    expect(response.body.company.logo_url).toBe("http://logo.url");
    expect(response.body.company.jobs.length).toBe(2);
  });

  test("Returns error without token", async () => {
    const response = await request(app).get(`/companies/test`);
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Unauthorized");
  });

  test("Returns error without bad token", async () => {
    const response = await request(app)
      .get(`/companies/test`)
      .send({ _token: "fakeToken" });
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Unauthorized");
  });

  test("Returns error message for nonexistent company handle", async () => {
    const response = await request(app)
      .get(`/companies/notHandle`)
      .send({ _token: userToken });
    expect(response.body).toEqual({
      message: "No company with handle notHandle was found",
      status: 400,
    });
  });
});

describe("POST /companies", function () {
  test("Creates a company", async () => {
    const response = await request(app).post(`/companies`).send({
      handle: "tbell",
      name: "Taco Bell",
      num_employees: 1200,
      description: "favorite of college students",
      logo_url: "https://www.tacodeli.com",
      _token: adminToken,
    });
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      company: {
        handle: "tbell",
        name: "Taco Bell",
        num_employees: 1200,
        description: "favorite of college students",
        logo_url: "https://www.tacodeli.com",
      },
    });
    const resp = await request(app)
      .get(`/companies`)
      .send({ _token: userToken });

    expect(resp.body.companies.length).toBe(5);
  });

  test("Doesn't create a company with user token", async () => {
    const response = await request(app).post(`/companies`).send({
      handle: "tbell",
      name: "Taco Bell",
      num_employees: 1200,
      description: "favorite of college students",
      logo_url: "https://www.tacodeli.com",
      _token: userToken,
    });
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Unauthorized");

    const resp = await request(app)
      .get(`/companies`)
      .send({ _token: userToken });

    expect(resp.body.companies.length).toBe(4);
  });

  test("Returns error message for company missing required info", async () => {
    const response = await request(app).post(`/companies`).send({
      name: "Taco Bell",
      num_employees: 1200,
      description: "favorite of college students",
      logo_url: "https://www.tacodeli.com",
      _token: adminToken,
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.message[0]).toBe(
      'instance requires property "handle"'
    );

    const resp = await request(app)
      .get(`/companies`)
      .send({ _token: userToken });
    expect(resp.body.companies.length).toBe(4);
  });
});

describe("PATCH /companies/:handle", function () {
  test("Updates a company with admin token", async () => {
    const response = await request(app).patch(`/companies/test`).send({
      name: "Taco Bell",
      num_employees: 1200,
      description: "favorite of college students",
      logo_url: "https://www.tacobell.com",
      _token: adminToken,
    });
    console.log(adminToken);
    console.log("UPDATES WITHADMIN TOKEN BODY", response.body);
    expect(response.statusCode).toBe(200);
    expect(response.body.company.handle).toEqual("test");
    expect(response.body.company.name).toEqual("Taco Bell");
    expect(response.body.company.num_employees).toEqual(1200);
    expect(response.body.company.description).toEqual(
      "favorite of college students"
    );
    expect(response.body.company.logo_url).toEqual("https://www.tacobell.com");

    const resp = await request(app).get(`/companies`).send({
      _token: adminToken,
    });

    expect(resp.body.companies.length).toBe(4);
  });

  test("Doesn't update company with non-auth token", async () => {
    const response = await request(app).patch(`/companies/test`).send({
      name: "Taco Bell",
      num_employees: 1200,
      description: "favorite of college students",
      logo_url: "https://www.tacodeli.com",
      _token: userToken,
    });
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Unauthorized");
  });

  test("Returns error message for duplicate name", async () => {
    const response = await request(app).patch(`/companies/test`).send({
      name: "big co",
      num_employees: 1200,
      description: "favorite of college students",
      logo_url: "https://www.tacodeli.com",
      _token: adminToken,
    });
    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe(
      'duplicate key value violates unique constraint "companies_name_key"'
    );
  });

  test("Returns error message for submitting handle in body", async () => {
    const response = await request(app).patch(`/companies/test`).send({
      handle: "test",
      name: "Taco Bell",
      _token: adminToken,
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.message[0]).toBe(
      'instance additionalProperty "handle" exists in instance when not allowed'
    );
  });
});

describe("DELETE /companies/:handle", function () {
  test("Deletes a company", async () => {
    const response = await request(app).delete(`/companies/test`).send({
      _token: adminToken,
    });
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ message: "Company deleted" });
    const resp = await request(app).get(`/companies`).send({
      _token: adminToken,
    });

    expect(resp.body.companies.length).toBe(3);
  });

  test("Does not delete a company with user token", async () => {
    const response = await request(app).delete(`/companies/test`).send({
      _token: userToken,
    });

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Unauthorized");

    const resp = await request(app).get(`/companies`).send({
      _token: adminToken,
    });
  });

  test("Returns error message for company missing required info", async () => {
    const response = await request(app).delete(`/companies/notHandle`).send({
      _token: adminToken,
    });
    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe("handle is not defined");
  });
});
