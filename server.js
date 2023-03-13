"use strict";
require("dotenv").config();
const express = require("express");
const myDB = require("./connection");
const session = require("express-session");
// const passport = require("passport");
// const bcrypt = require("bcrypt");
const routes = require("./routes");
// const { ObjectID } = require("mongodb");
// const LocalStrategy = require("passport-local");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const auth = require("./auth");

const app = express();

const http = require("http").createServer(app);
const io = require("socket.io")(http);

fccTesting(app); //For FCC testing purposes
app.set("view engine", "pug");
app.set("views", "./views/pug");
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

myDB(async (client) => {
  const myDatabase = await client.db("database").collection("users");
  console.log("Successful connection");

  let currentUsers = 0;
  io.on("connection", (socket) => {
    console.log("A user has connected");
    ++currentUsers;
    io.emit("user count", currentUsers);
  });

  auth(app, myDatabase);
  routes(app, myDatabase);

  app.use((req, res, next) => {
    res.status(404).type("text").send("Not Found");
  });
}).catch((e) => {
  console.log("Connection Unsuccessful");
  app.route("/").get((req, res) => {
    res.render("index", { title: e, message: "Unable to connect to database" });
  });
});

// app.route("/").get((req, res) => {
//   res.render("index", {
//     title: "Hello",
//     message: "Please log in",
//   });
// });

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
