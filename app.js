const express = require("express");
const bodyParser = require('body-parser')
const apiRouter = require("./backend/apirouter.js");
const mongoose = require("mongoose");

// Init MongoDB
mongoose.connect('mongodb://localhost/my_database', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Init express
let app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname+"/public_www"));
app.use('/api', apiRouter)


// Start the application
app.listen(3001);
console.log("Running in port 3001");