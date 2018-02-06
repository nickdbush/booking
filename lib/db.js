const mkdirp = require("mkdirp");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const shortid = require("shortid");

mkdirp.sync("data");
const adapter = new FileSync("data/db.json");

const db = low(adapter);

db
  .defaults({
    users: [],
    events: [],
    reservations: []
  })
  .write();

module.exports = db;
