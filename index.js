// index.js
// where your node app starts

// init project
var express = require("express");
var mongoose = require("mongoose");
var mongo = require("mongodb");
var port = process.env.PORT || 3000;
var app = express();
require("dotenv").config();

//This is the database connection for APIs that requires a database, like exercise Tracking API
mongoose.connect(
  process.env.MONGO_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  },
  () => {
    console.log("Connected to database");
  }
);

// so that your API is remotely testable by FCC
var cors = require("cors");

// Everytime we work with the body of a Json object we have to app.use this!!!
app.use(express.urlencoded({ extended: true }));
app.use(cors({ optionsSuccessStatus: 200 })); // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// http://expressjs.com/en/starter/basic-routing.html

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/views/index.html");
});

// Exercise Tracker api html endpoint
app.get("/exerciseTracker", function (req, res) {
  res.sendFile(__dirname + "/views/exerciseTracker.html");
});

// UrlShortener api html endpoint
app.get("/urlShortener", function (req, res) {
  res.sendFile(__dirname + "/views/urlShortener.html");
});
// HeaderParser api html endpoint
app.get("/headerParser", function (req, res) {
  res.sendFile(__dirname + "/views/headerParser.html");
});
// Timestamp api html endpoint
app.get("/timestamp", function (req, res) {
  res.sendFile(__dirname + "/views/timestamp.html");
});

//---------------------------------------------------------------------------------------------------------------------------------------
// Exercise Tracker API
// Firstly we create a mongoose schema to hold the structure that we need, in this case only username will be required
const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
    },
  },
  { versionKey: false }
);

// After the schema is created, we create a mongoose model that will work with that schema
// two arguments are required here, the name of the model and the schema it uses
const User = mongoose.model("User", userSchema);

// Schema for exercises
const exerciseSchema = mongoose.Schema(
  {
    username: String,
    description: String,
    duration: Number,
    date: String,
    userId: String,
  },
  { versionKey: false }
);
// Model for exercises
const Exercise = mongoose.model("Exercise", exerciseSchema);

// GET request to api/user
// Display all users
app.get("/api/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});
// POST request to api/users
app.post("/api/users", async (req, res) => {
  const username = req.body.username;
  // In order to only create a user if that one does not yet exist, we have to check if the value is already there
  const foundUser = await User.findOne({ username });
  if (foundUser) {
    return res.json({
      error: "That username " + username + " is already taken",
    });
  }
  const user = await User.create({
    username,
  });
  res.json(user);
});
// POST to /api/users/:_id/exercises
app.post("/api/users/:_id/exercises", async (req, res) => {
  const userId = req.body[":_id"];
  let { description, duration, date } = req.body;

  const foundUser = await User.findById(userId);
  if (!foundUser) {
    return res.json({ Message: "No username found!" });
  }
  if (!date) {
    date = new Date();
  } else {
    date = new Date(date);
  }
  // Now that we already dealt with every parameter, we can create and save a new exercise document
  // using the exercise schema we just defined
  Exercise.create({
    username: foundUser.username,
    description,
    duration,
    date,
    userId: userId,
  });

  // This is the response
  res.json({
    username: foundUser.username,
    description,
    duration,
    date: date.toDateString(),
    _id: userId,
  });
});
// GET request to /api/users/:_id/logs
app.get("/api/users/:_id/logs", async (req, res) => {
  const userId = req.params._id;
  let foundUser = await User.findById(userId);
  if (!foundUser) {
    res.json({ Message: "No username found!" });
  }
  // Here we look for all documents linked to that userId
  let exercises = await Exercise.find({ userId });
  // Here we are just excluding the fields we dont want to send back to user
  exercises = exercises.map((exercise) => {
    return {
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date,
    };
  });
  // Here we set our response object
  res.json({
    username: foundUser.username,
    count: exercises.length,
    _id: userId,
    logs: exercises,
  });
});
// End of exercise tracker API
//---------------------------------------------------------------------------------------------------------------------------------------

// Url Shortener API

originalUrls = [];
shortUrls = [];
app.post("/api/shorturl", (req, res) => {
  let url = req.body.url;
  let foundIndex = originalUrls.indexOf(url);

  if (!url.includes("https://") && !url.includes("http://")) {
    return res.json({
      error: "Invalid Url",
    });
  }

  if (foundIndex < 0) {
    originalUrls.push(url);
    shortUrls.push(shortUrls.length);
    return res.json({
      original_url: url,
      short_url: shortUrls.length - 1,
    });
  }
  return res.json({
    original_url: url,
    short_url: shortUrls[foundIndex],
  });
});

app.get("/api/shorturl/:shorturl", (req, res) => {
  let shortUrl = parseInt(req.params.shorturl);
  let foundIndex = shortUrls.indexOf(shortUrl);
  if (foundIndex < 0) {
    return res.json({
      error: "No such url was found!",
    });
  }
  res.redirect(originalUrls[foundIndex]);
});

// End of url shortener API
//---------------------------------------------------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------------------------------------------
// Start of who am I API
app.get("/api/whoami", (req, res) => {
  res.json({
    ipaddress: req.socket.remoteAddress,
    language: req.headers["accept-language"],
    software: req.headers["user-agent"],
  });
});

//End of Who am I API
//---------------------------------------------------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------------------------------------------
// Start of Timestamp API
// If the request is passed with a empty string as argument, it should return today's date
app.get("/api/", (req, res) => {
  let date = new Date();
  res.json({
    unix: date.getTime(),
    utc: date.toUTCString(),
  });
});
// Request with date input
app.get("/api/:date_string", (req, res) => {
  // Firstly, we get the date value from the request and store it in a variable and create a new date variable as well
  let dateString = req.params.date_string;
  let date = new Date(dateString);
  // Here is where we are working with unix arguments, as the req input will come as a string, we have to parse it as a integer so we can
  // get a date value from it, but at the same time, we dont want to mess with the case where the input is on a regular date format,
  // thinking of that, we create this if statement checking against 10000, which will only be true for int values parsed from unix formats
  // for a very long time and then we give the json object as the response.
  if (parseInt(dateString) > 10000) {
    let dateToCheck = new Date(parseInt(dateString));
    res.json({
      unix: parseInt(dateString),
      utc: dateToCheck.toUTCString(),
    });
  }
  // Here we work with the invalid date passeed as an argument, as everything apart from a valid date format will be invalid,
  // we use the if to work with that and the else for the actuall valid input
  if (date == "Invalid Date") {
    res.json({
      error: "Invalid Date",
    });
  } else {
    // If it is a valid date format, we then just return the json object with the data as the reponse.
    res.json({
      unix: date.getTime(),
      utc: date.toUTCString(),
    });
  }
});

// listen for requests :)
var listener = app.listen(port, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
