const express = require("express");
const bodyParser = require('body-parser')
const apiRouter = require("./backend/apirouter.js");
const mongoose = require("mongoose");
const fileUpload = require('express-fileupload');
const cors = require('cors')

// Init MongoDB
//mongoose.connect('mongodb://localhost/my_database', {
//  useNewUrlParser: true,
//  useUnifiedTopology: true
//});

// Init express
let app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('./public'));
app.use(express.static('./fileStorage'));
//app.use(express.static(__dirname+"/public"));
app.use('/api', apiRouter)


// Start the application
app.listen(3001);
console.log("Running in port 3001");