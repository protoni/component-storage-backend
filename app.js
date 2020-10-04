/* eslint-disable no-console */
const express = require('express');
const bodyParser = require('body-parser');
const apiRouter = require('./backend/apirouter.js');

// Init express
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('./public'));
app.use(express.static('./fileStorage'));
app.use('/api', apiRouter);

// Start the application
module.exports = app.listen(3001);
console.log('Running in port 3001');
