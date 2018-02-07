const Db = require("./db");

const formatEmail = email => email.trim().toLowerCase();

const getUserByEmail = email =>
  Db.get("users")
    .find(x => x["email"] === email)
    .value();

const _createUser = values =>
  Db.get("users")
    .push(values)
    .write();

const createUser = values => {
  if (getUserByEmail(values["email"])) {
    return values;
  }
  return _createUser(values);
};

const checkAuth = req => {
  const auth = req.signedCookies["auth"];
  if (auth) {
    const user = getUserByEmail(auth);
    return user;
  }
  return false;
};

const authenticate = (
  onFail = (req, res, next) => {
    req.sendStatus(401);
  }
) => (req, res, next) => {
  const user = checkAuth(req);
  if (user) {
    req.user = user;
    next();
    return;
  }
  onFail(req, res, next);
};

const setCookie = (res, email, secure = false) => {
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear + 1);
  res.cookie("auth", email, {
    httpOnly: true,
    secure: secure,
    expires: expiry,
    signed: true
  });
};

module.exports = {
  formatEmail,
  getUserByEmail,
  createUser,
  authenticate,
  checkAuth,
  setCookie
};
