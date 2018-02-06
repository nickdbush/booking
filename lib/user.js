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

const checkAuth = req => {
  const auth = req.signedCookies["auth"];
  if (auth) {
    const user = getUserByEmail(auth);
    return user;
  }
  return false;
};

const authenticate = (
  onFail = (req, res) => {
    req.sendStatus(401);
  }
) => (req, res, next) => {
  const user = checkAuth(req);
  if (user) {
    req.user = user;
    next();
    return;
  }
  onFail(req, res);
};

module.exports = {
  formatEmail,
  getUserByEmail,
  createUser,
  authenticate,
  checkAuth
};
