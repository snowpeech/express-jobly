/** Express app for jobly. */

const express = require("express");
const morgan = require("morgan");
const app = express();

const ExpressError = require("./helpers/expressError");
const { authenticateJWT } = require("./middleware/auth");
const companyRoutes = require("./routes/companies");
const jobRoutes = require("./routes/jobs");
const userRoutes = require("./routes/users");

app.use(express.json());
app.use(authenticateJWT);
// add logging system
// app.use(morgan("tiny"));

/** routes */
app.use("/companies", companyRoutes);
app.use("/jobs", jobRoutes);
app.use("/users", userRoutes);

/** 404 handler */

// app.post("/login", async function (req, res, next) {
//   // This should authenticate a user and return a JSON Web Token which contains a payload with the username and is_admin values.
//   // This should return JSON: {token: token}
//   try {
//     let { username, password } = req.body;
//     if (await User.authenticate(username, password)) {
//       let token = jwt.sign({ username }, SECRET_KEY);

//       return res.json({ token });
//     } else {
//       throw new ExpressError("Invalid username/password", 400);
//     }
//   } catch (err) {
//     return next(err);
//   }
// });

app.use(function (req, res, next) {
  const err = new ExpressError("Not Found", 404);

  // pass the error to the next piece of middleware
  return next(err);
});

/** general error handler */

app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  console.error(err.stack);

  return res.json({
    status: err.status,
    message: err.message,
  });
});

module.exports = app;
