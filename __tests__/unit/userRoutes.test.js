process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../../app");
const db = require("../../db");

beforeEach(async () => {
  await db.query(
    `INSERT INTO users 
        (username, password, first_name, last_name, email)
        VALUES
        ('user1', 'secret123', 'Joy', 'Lee', 'joy@gmail.com'),
        ('user2', 'secret123', 'Sara', 'Lee', 'sara@gmail.com'),
        ('user3', 'secret123', 'Hope', 'Lee', 'hope@gmail.com')
        `
  );
});

afterEach(async () => {
  await db.query(` DELETE FROM users`);
});

afterAll(async () => {
  await db.end();
});

describe("GET users/", function () {
  test("Returns all user data", async () => {
    const response = await request(app).get(`/users`);
    expect(response.statusCode).toBe(200);

    expect(response.body.users.length).toBe(3);
  });
});

describe("POST users/", function () {
  test("Creates a new user and returns user data", async () => {
    const response = await request(app).post(`/users`).send({
      username: "test1",
      password: "abc123",
      first_name: "jo",
      last_name: "schmo",
      email: "a@b.com",
    });
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      username: "test1",
      first_name: "jo",
      last_name: "schmo",
      email: "a@b.com",
    });

    const resp = await request(app).get(`/users`);
    expect(resp.body.users.length).toBe(4);
  });

  test("Doesn't create a user with incomplete data", async () => {
    const response = await request(app).post(`/users`).send({
      username: "test1",
      password: "abc123",
      last_name: "schmo",
      email: "a@b.com",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.message[0]).toBe(
      'instance requires property "first_name"'
    );

    const resp = await request(app).get(`/users`);
    expect(resp.body.users.length).toBe(3);
  });
});

describe("GET /users/:username", function () {
  test("Returns a users' data", async () => {
    const response = await request(app).get(`/users/user1`);
    expect(response.statusCode).toBe(200);
    expect(response.body.user.username).toBe("user1");
    expect(response.body.user.password).toBeUndefined();
    expect(response.body.user.first_name).toBe("Joy");
    expect(response.body.user.last_name).toBe("Lee");
    expect(response.body.user.email).toBe("joy@gmail.com");
    expect(response.body.user.photo_url).toBeNull();
  });

  test("Returns error message for nonexistent username", async () => {
    const response = await request(app).get(`/users/notUser`);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("notUser not found");
  });
});

describe("PATCH /users/:username", function () {
  test("Updates a user", async () => {
    const response = await request(app).patch(`/users/user1`).send({
      first_name: "tinkerbell",
      password: "fairydust",
    });
    expect(response.statusCode).toBe(200);

    expect(response.body.user.first_name).toBe("tinkerbell");
    expect(response.body.user.password).toBe("fairydust");
  });

  test("Returns an error when trying to update a username", async () => {
    const response = await request(app).patch(`/users/user1`).send({
      username: "fairygirl",
      first_name: "tinkerbell",
      password: "fairydust",
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.message[0]).toBe(
      'instance additionalProperty "username" exists in instance when not allowed'
    );
    const resp = await request(app).get(`/users/user1`);
    expect(resp.body.user.username).toBe("user1");
  });
});

describe("DELETE /users/:username", function () {
  test("Deletes a user", async () => {
    const res = await request(app).get("/users");
    const response = await request(app).delete(`/users/user1`);

    expect(response.statusCode).toBe(200);
    const resp = await request(app).get(`/users`);
    expect(resp.body.users.length).toBe(2);
  });

  test("Does not delete a user at wrong username", async () => {
    const response = await request(app).delete(`/users/notUser`);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("notUser not found");

    const resp = await request(app).get(`/users`);
    expect(resp.body.users.length).toBe(3);
  });
});
