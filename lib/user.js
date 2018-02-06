const Db = require("./db");

const formatEmail = email => email.trim().toLowerCase();

const getUserByEmail = email =>
  Db.get("users")
    .find(x => x["email"] === email)
    .value();

const createUser = values =>
  Db.get("users")
    .push(values)
    .write();

const authenticate = (
  onFail = (req, res) => {
    req.sendStatus(401);
  }
) => (req, res, next) => {
  if (req.signedCookies["auth"]) {
    const user = getUserByEmail(req.signedCookies["auth"]);
    if (user) {
      req.user = user;
      next();
      return;
    }
  }
  onFail(req, res);
};

module.exports = { formatEmail, getUserByEmail, createUser, authenticate };
