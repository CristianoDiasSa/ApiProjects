const MONGO_URI =
  "mongodb+srv://Cristiano:123@freecodecamptutorial.41hzsrf.mongodb.net/?retryWrites=true&w=majority";
// index.js
// where your node app starts

// init project
var express = require("express");
var shortId = require("shortid");
var mongoose = require("mongoose");
var mongo = require("mongodb");
var bodyParser = require("body-parser");
var port = process.env.PORT || 3000;
var app = express();

//This connection will go when deployed
mongoose.connect(process.env.MONGO_URI);
/*
//This connection is for local testing
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
*/
// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC
var cors = require("cors");
app.use(cors({ optionsSuccessStatus: 200 })); // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/views/index.html");
});

// Timestamp api html endpoint
app.get("/timestamp", function (req, res) {
  res.sendFile(__dirname + "/views/timestamp.html");
});

app.get("/headerParser", function (req, res) {
  res.sendFile(__dirname + "/views/headerParser.html");
});

app.get("/urlShortener", function (req, res) {
  res.sendFile(__dirname + "/views/urlShortener.html");
});

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
//---------------------------------------------------------------------------------------------------------------------------------------
// Url Shortener API
// Create schema and model to store urls
let ShortUrl = mongoose.model(
  "ShortUrl",
  new mongoose.Schema({
    original_url: String,
    short_url: String,
    id: String,
  })
);
// Mounting body-parser
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());
// Post request
app.post("/api/shorturl/", (req, res) => {
  let original_url = req.body.url;
  let url_id = shortId.generate();
  let newShortUrl = url_id;

  let newUrl = new ShortUrl({
    original_url: original_url,
    short_url: __dirname + "/api/shorturl/" + url_id,
    id: url_id,
  });
  newUrl.save(function (error, done) {
    if (error) return console.log(error);
    res.json({
      original_url: newUrl.original_url,
      short_url: newUrl.short_url,
    });
  });
});

app.get("/api/shorturl/:id", (req, res) => {
  let userGeneratedShortUrl = req.params.id;
  ShortUrl.find({ id: userGeneratedShortUrl }).then(function (foundUrls) {
    let urlForRedirect = foundUrls[0];
    res.redirect(urlForRedirect.original_url);
  });
});

// End of url shortener API
//---------------------------------------------------------------------------------------------------------------------------------------
// listen for requests :)
var listener = app.listen(port, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
