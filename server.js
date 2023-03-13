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
const passportSocketIo = require("passport.socketio");
const MongoStore = require("connect-mongo")(session);
const cookieParser = require("cookie-parser");

const app = express();

const http = require("http").createServer(app);
const io = require("socket.io")(http);

let currentUsers = 0;
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });

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
    store: store,
    key: "express.sid",
    cookie: { secure: false },
  })
);

function onAuthorizeSuccess(data, accept) {
  console.log("successful connection to socket.io");

  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log("failed connection to socket.io:", message);
  accept(null, false);
}
myDB(async (client) => {
  const myDatabase = await client.db("database").collection("users");
  console.log("Successful connection");

  io.use(
    passportSocketIo.authorize({
      cookieParser: cookieParser,
      key: "express.sid",
      secret: process.env.SESSION_SECRET,
      store: store,
      success: onAuthorizeSuccess,
      fail: onAuthorizeFail,
    })
  );

  io.on("connection", (socket) => {
    console.log("user " + socket.request.user.username + " connected");
    ++currentUsers;
    io.emit("user", {
      username: socket.request.user.username,
      currentUsers,
      connected: true,
    });
    socket.on("chat message", (message) => {
      io.emit("chat message", {
        username: socket.request.user.username,
        message,
      });
    });
    socket.on("disconnecting", () => {
      --currentUsers;
      console.log("user " + socket.request.user.username + " disconnected");
      io.emit("user", {
        username: socket.request.user.username,
        currentUsers,
        connected: false,
      });
      // io.emit("disconnect", currentUsers);
    });
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
