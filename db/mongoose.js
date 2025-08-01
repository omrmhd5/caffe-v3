const mongoose = require("mongoose");

const DB_HOST = process.env.DB_HOST || "127.0.0.1";
const DB_PORT = process.env.DB_PORT || 27017;
const DB_NAME = process.env.DB_NAME || "cafe-api";
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;

let connectionString = `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`;
if (DB_USER && DB_PASS) {
  connectionString = `mongodb://${encodeURIComponent(
    DB_USER
  )}:${encodeURIComponent(DB_PASS)}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
}

// let connectionString = process.env.MONGO_URI;

mongoose
  .connect(connectionString)
  .then((r) => console.log("Connected to mongo"))
  .catch((e) => console.log("could not connect", e));
