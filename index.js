const express = require("express");
const handlebars = require("express-handlebars");
const dateformat = require("dateformat");

const User = require("./lib/user");
const Event = require("./lib/event");
const Db = require("./lib/db");

const app = express();
app.use(require("body-parser").urlencoded({ extended: true }));
app.use(require("body-parser").json());
app.use(require("cookie-parser")(process.env.COOKIE_SECRET || "3rt48k8o642"));
app.set("trust proxy", 1);

app.engine("handlebars", handlebars({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

const getUser = User.authenticate((req, res, next) => next());
const apiAuth = (req, res, next) => {
  const auth = req.get("X-Auth");
  if (auth) {
    if (
      auth === "3rt48k8o642" ||
      (process.env.API_TOKEN && auth === process.env.API_TOKEN)
    ) {
      next();
      return;
    }
  }
  res.sendStatus(401);
};

app.get("/", getUser, (req, res) => {
  const events = Event.getEvents();
  res.render("list", { events, user: req.user });
});

app.get("/login", (req, res) => {
  const user = User.checkAuth(req);
  if (user) {
    res.redirect("/");
    return;
  } else {
    res.clearCookie("auth");
  }
  res.render("login", {
    redirect: req.query.redirect ? `/event/${req.query.redirect}` : "/"
  });
});

app.get("/event/:id", getUser, (req, res) => {
  const event = Event.getEvent(req.params["id"]);
  if (!event) {
    res.redirect("/");
    return;
  }
  const spacesLeft = Event.spacesLeft(event["id"]);
  const spacesAvailable = Math.min(spacesLeft, 4);
  res.render("details", {
    user: req.user,
    event: {
      ...event,
      longDescription: event["longDescription"].split("\n"),
      date: dateformat(new Date(event["date"]), "dddd dS mmmm, h:MMtt"),
      spacesLeft,
      spacesAvailable,
      reservation: req.user
        ? Event.reservationsForPerson(event.id, req.user.email)
        : null,
      has1: spacesAvailable >= 1,
      has2: spacesAvailable >= 2,
      has3: spacesAvailable >= 3,
      has4: spacesAvailable >= 4
    }
  });
});

app.post("/reservation/:eventId", User.authenticate(), (req, res) => {
  const spaces = req.body.spaces;
  if (spaces !== 1 && spaces !== 2 && spaces !== 3 && spaces !== 4) {
    return res.sendStatus(400);
  }
  const event = Event.getEvent(req.params.eventId);
  if (!event) {
    return res.sendStatus(400);
  }
  const result = Event.makeReservation(
    req.params.eventId,
    req.user.email,
    spaces
  );
  res.status(201).json(result);
});

app.delete("/reservation/:eventId", User.authenticate(), (req, res) => {
  const event = Event.getEvent(req.params.eventId);
  if (!event) {
    return res.sendStatus(400);
  }
  const result = Event.deleteReservation(event.id, req.user.email);
  res.json(result);
});

app.post("/user", (req, res) => {
  const { email, name } = req.body;
  if (!email || !name) {
    res.sendStatus(400);
    return;
  }
  const user = User.createUser({ email, name });
  User.setCookie(res, email, req.secure);
  res.json({ email, name });
});

app.post("/auth", (req, res) => {
  const email = req.body.email;
  if (!email) {
    res.sendStatus(400);
    return;
  }
  const user = User.getUserByEmail(email);
  if (!user) {
    res.status(400).send("Email not found");
    return;
  }
  User.setCookie(res, email, req.secure);
  res.sendStatus(200);
});

app.get("/logout", (req, res) => {
  res.clearCookie("auth");
  res.redirect("/login");
});

app.post("/api/event", apiAuth, (req, res) => {
  const event = req.body;
  const result = Event.saveEvent(event);
  res.json(result);
});

app.put("/api/event/:id", apiAuth, (req, res) => {
  const id = req.params.id;
  const values = req.body;
  const result = Event.updateEvent(id, values);
  res.json(result);
});

app.delete("/api/event/:id", apiAuth, (req, res) => {
  const id = req.params.id;
  const result = Event.deleteEvent(id);
  res.json(result);
});

app.post("/api/user", apiAuth, (req, res) => {
  const user = req.body;
  const result = User.createUser(user);
  res.json(result);
});

app.get("/api/all", apiAuth, (req, res) => {
  const state = Db.getState();
  res.json(state);
});

app.use(express.static("./static"));

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Server listening on *:${port}`));
