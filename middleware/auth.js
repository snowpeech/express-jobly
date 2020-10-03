/** Middleware for handling req authorization for routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

/** Middleware: Authenticate user. */

function authenticateJWT(req, res, next) {
  try {
    console.log("AUTHENTICATE JWT");
    const tokenFromBody = req.body._token;
    console.log("AUTHENTICATE JWT body", req.body);
    const payload = jwt.verify(tokenFromBody, SECRET_KEY);
    console.log("AUG", payload);
    req.user = payload; // store user from token in req.user
    console.log("AUTHENTICATE JWT REQ.USER", req.user);
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware: Requires user is authenticated. */

function ensureLoggedIn(req, res, next) {
  if (!req.user) {
    return next({ status: 401, message: "Unauthorized" });
  } else {
    return next();
  }
}

/** Middleware: Requires user is admin. */

function ensureIsAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return next({ status: 401, message: "Unauthorized" });
  } else {
    return next();
  }
}

/** Middleware: Requires correct username. */

function ensureCorrectUser(req, res, next) {
  console.log("ENSURE CORRECT USER");
  console.log(":::::::::", req.params.username); //looks good
  console.log(":::::::::req user", req.user);
  try {
    console.log("USER USERNAME:::::::::", req.user.username);
    console.log("PARAMS USERNAME:::::::::", req.params.username);
    if (req.user.username === req.params.username) {
      return next();
    } else {
      return next({ status: 401, message: "Unauthorized" });
    }
  } catch (err) {
    // errors would happen here if we made a request and req.user is undefined
    return next({ status: 401, message: "Unauthorized" });
  }
}
// end

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureIsAdmin,
  ensureCorrectUser,
};
