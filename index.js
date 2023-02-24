// index.js
// where your node app starts

// init project
var express = require('express');
var app = express();
var port = process.env.PORT || 3000;

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({optionsSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});


// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

// If the request is passed with a empty string as argument, it should return today's date
app.get('/api/timestamp/', (req, res)=>{
  let date = new Date();
  res.json({
    "unix" : date.getTime() ,
    "utc" : date.toUTCString()
  });
});

// Here is where the fun begins - Timestamp API
app.get("/api/timestamp/:date_string", (req, res)=>{
// Firstly, we get the date value from the request and store it in a variable and create a new date variable as well
let dateString = req.params.date_string;
let date = new Date(dateString);
// Here is where we are working with unix arguments, as the req input will come as a string, we have to parse it as a integer so we can
// get a date value from it, but at the same time, we dont want to mess with the case where the input is on a regular date format,
// thinking of that, we create this if statement checking against 10000, which will only be true for int values parsed from unix formats 
// for a very long time and then we give the json object as the response.
if (parseInt(dateString)> 10000){
  res.json({
    "unix" : dateString,
    "utc" : new Date(parseInt(dateString)),
  });
};
// Here we work with the invalid date passeed as an argument, as everything apart from a valid date format will be invalid, 
// we use the if to work with that and the else for the actuall valid input
if(date == "Invalid Date"){
  res.json({
    'error' : 'Invalid Date'
  });
}else{
// If it is a valid date format, we then just return the json object with the data as the reponse.
  res.json({
    "unix" : date.getTime() ,
    "utc" : date.toUTCString()
  });
};
});



// listen for requests :)
var listener = app.listen(port, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
