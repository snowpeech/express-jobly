process.env.NODE_ENV = "test";

const request = require("supertest");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = require("../../app");
const db = require("../../db");
const { SECRET_KEY } = require("../../config");
const BCRYPT_WORK_FACTOR = 1;

let testUserToken;
let adminUserToken;

beforeEach(async () => {
  const hashedPassword = await bcrypt.hash("secret123", BCRYPT_WORK_FACTOR);

  await db.query(
    `INSERT INTO users 
        (username, password, first_name, last_name, email,is_admin)
        VALUES
        ('admin', '${hashedPassword}', 'Kona', 'K', 'kona@gmail.com',true),
        ('user', '${hashedPassword}', 'Sushi', 'S', 'sushi@gmail.com',false),
        ('user2', '${hashedPassword}', 'Hope', 'Lee', 'hope@gmail.com',false)`
  );
  const testAdmin = { username: "admin", is_admin: true };
  const testUser = { username: "user", is_admin: false };

  testUserToken = jwt.sign(testUser, SECRET_KEY);
  adminUserToken = jwt.sign(testAdmin, SECRET_KEY);
});

afterEach(async () => {
  await db.query(` DELETE FROM users`);
});

afterAll(async () => {
  await db.end();
});

// describe("isthis working", () => {
//   test("1=1", () => {
//     console.log("testUserToken", testUserToken);
//     console.log("adminUserToken", adminUserToken);
//     expect(1).toBe(1);
//   });
// });

describe("GET users/", function () {
  test("Returns all user data for logged in user", async () => {
    const response = await request(app)
      .get(`/users`)
      .send({ _token: testUserToken });

    expect(response.statusCode).toBe(200);

    expect(response.body.users.length).toBe(3);
  });
  test("Returns user data for any  user", async () => {
    const response = await request(app).get(`/users`);

    expect(response.statusCode).toBe(200);

    expect(response.body.users.length).toBe(3);
  });
});

describe("POST users/", function () {
  test("Registers a new user and returns token", async () => {
    const response = await request(app).post(`/users`).send({
      username: "test1",
      password: "abc123",
      first_name: "jo",
      last_name: "schmo",
      email: "a@b.com",
    });
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({ _token: expect.any(String) })
    );

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

describe("POST users/login", function () {
  test("Log in a user and returns token", async () => {
    const response = await request(app).post(`/users/login`).send({
      username: "user",
      password: "secret123",
    });
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({ _token: expect.any(String) })
    );
    expect(response.body.message).toEqual("Logged in!");
  });

  test("Doesn't login without username", async () => {
    const response = await request(app).post(`/users/login`).send({
      password: "abc123",
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("Username and password required");
  });

  test("Doesn't login without password", async () => {
    const response = await request(app).post(`/users/login`).send({
      username: "user1",
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("Username and password required");
  });

  test("Doesn't login with nonexistent username ", async () => {
    const response = await request(app).post(`/users/login`).send({
      username: "notUser",
      password: "abc123",
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("Wrong password/username");
  });
  test("Doesn't login with bad password username ", async () => {
    const response = await request(app).post(`/users/login`).send({
      username: "user1",
      password: "notPassword",
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual("Wrong password/username");
  });
});

describe("GET /users/:username", function () {
  test("Returns a users' data", async () => {
    const response = await request(app).get(`/users/user`);
    expect(response.statusCode).toBe(200);
    expect(response.body.user.username).toBe("user");
    expect(response.body.user.password).toBeUndefined();
    //need to compare to hash
    expect(response.body.user.first_name).toBe("Sushi");
    expect(response.body.user.last_name).toBe("S");
    expect(response.body.user.email).toBe("sushi@gmail.com");
    expect(response.body.user.photo_url).toBeNull();
  });

  test("Returns error message for nonexistent username", async () => {
    const response = await request(app).get(`/users/notUser`);
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("notUser not found");
  });
});

describe("PATCH /users/:username", function () {
  test("Updates a user", async () => {
    const response = await request(app).patch(`/users/user`).send({
      first_name: "tinkerbell",
      _token: testUserToken,
    });

    expect(response.statusCode).toBe(200);

    expect(response.body.user.first_name).toBe("tinkerbell");
  });

  test("Doesn't update user with wrong token", async () => {
    const response = await request(app).patch(`/users/user`).send({
      first_name: "tinkerbell",
      _token: adminUserToken,
    });
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Unauthorized");
  });

  test("Returns an error when trying to update a username", async () => {
    const response = await request(app).patch(`/users/user`).send({
      username: "fairygirl",
      first_name: "tinkerbell",
      _token: testUserToken,
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.message[0]).toBe(
      'instance additionalProperty "username" exists in instance when not allowed'
    );
    const resp = await request(app).get(`/users/user`);
    expect(resp.body.user.username).toBe("user");
  });

  test("Returns an error when updating email to duplicate", async () => {
    const response = await request(app).patch(`/users/user`).send({
      email: "kona@gmail.com",
      _token: testUserToken,
    });
    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe(
      'duplicate key value violates unique constraint "users_email_key"'
    );
    const resp = await request(app).get(`/users/user`);
    expect(resp.body.user.email).toBe("sushi@gmail.com");
  });
});

describe("DELETE /users/:username", function () {
  test("Deletes a user", async () => {
    // const res = await request(app).get("/users");
    const response = await request(app).delete(`/users/user`).send({
      _token: testUserToken,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("User deleted");

    const resp = await request(app).get(`/users`);
    expect(resp.body.users.length).toBe(2);
  });

  test("Does not delete a user with wrong username", async () => {
    const response = await request(app).delete(`/users/notUser`).send({
      _token: testUserToken,
    });
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Unauthorized");

    const resp = await request(app).get(`/users`);
    expect(resp.body.users.length).toBe(3);
  });
});
