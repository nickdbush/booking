const shortid = require("shortid");

const Db = require("./db");

const getEvents = () => Db.get("events").value();

const getEvent = id =>
  Db.get("events")
    .find(x => x["id"] === id)
    .value();

const saveEvent = values =>
  Db.get("events")
    .push({
      id: shortid(),
      ...values
    })
    .write();

const updateEvent = (eventId, values) =>
  Db.get("events")
    .find(x => x["id"] === eventId)
    .assign(values)
    .write();

const deleteEvent = eventId =>
  Db.get("events")
    .remove(x => x["id"] === eventId)
    .write();

const reservationsForEvent = eventId =>
  Db.get("reservations")
    .filter(x => x["eventId"] === eventId)
    .value();

const reservationsForPerson = (eventId, userId) =>
  reservationsForEvent(eventId).find(x => x["userId"] === userId);

const deleteReservation = (eventId, userId) =>
  Db.get("reservations")
    .remove(x => x["eventId"] === eventId && x["userId"] === userId)
    .value();

const spacesLeft = eventId => {
  const event = getEvent(eventId);
  const currentReservations = reservationsForEvent(eventId);
  const spacesTaken = currentReservations.reduce(
    (total, x) => total + x["spaces"],
    0
  );
  return event["maxPeople"] - spacesTaken;
};

const _reserve = (eventId, userId, spaces) =>
  Db.get("reservations")
    .push({ eventId, userId, spaces })
    .write();

const makeReservation = (eventId, userId, spacesWanted) => {
  const spaces = spacesLeft(eventId);

  if (spacesWanted > spaces) {
    spacesWanted = spaces;
  }
  if (spacesWanted > 4) {
    spacesWanted = 4;
  }
  if (spacesWanted < 1) {
    spacesWanted = 1;
  }

  return _reserve(eventId, userId, spacesWanted);
};

module.exports = {
  getEvents,
  getEvent,
  spacesLeft,
  saveEvent,
  updateEvent,
  deleteEvent,
  deleteReservation,
  reservationsForPerson,
  reservationsForEvent,
  makeReservation
};
