/* eslint-disable no-console */
const express = require('express');
const path = require('path');

const apiRouter = express.Router();
const util = require('util');
const readlineSync = require('readline-sync');
const multer = require('multer');
const Database = require('./MySqlDatabase.js');
const FileHandler = require('./FileHandler.js');

const UPLOADED_FILE_SUFFIX = 'fileUpload';
const UPLOAD_DESTINATION = './public/uploads/';

// Setup disk storage
const storage = multer.diskStorage({
  destination: UPLOAD_DESTINATION,
  filename(req, file, cb) {
    cb(null, file.originalname);
  },
});

// Check File Type
function checkFileType(file, cb) {
  // const filetypes = /txt|jpeg|jpg|png|gif|zip|pdf/;
  // const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // const mimetype = filetypes.test(file.mimetype);
  const extname = true;
  const mimetype = true;
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb('Error: Unsupported filetype!');

  return null;
}

// Setup file uploader
const upload = multer({
  storage,
  limits: { fileSize: 100000000 },
  fileFilter(req, file, cb) {
    checkFileType(file, cb);
  },
}).any('file');

// Get the MySQL password
function promptPassword() {
  const pw = readlineSync.question('Password: ', { hideEchoBack: true });
  return pw;
}
const password = promptPassword();

// Init MySQL database
const db = new Database('localhost', 'admin', password, 'test');

// Temp. Current saved blog file names.
global.savedFiles = [];

// Init FileHandler
const fileHandler = new FileHandler(UPLOAD_DESTINATION);

function printObject(obj) {
  console.log(util.inspect(obj, false, null, true /* enable colors */));
}

apiRouter.get('/getComponents', async (req, res) => {
  console.log('GET component data');
  // let data = {};
  const components = await db.getComponents();

  res.status(200).json({ data: components });
});

apiRouter.get('/getComponent/:id', async (req, res) => {
  const { id } = req.params;

  console.log(`GET component data for id: ${id}`);
  const component = await db.getComponent(id);
  component.filePath = path.join(__dirname, '..', fileHandler.getFileStoragePath());
  const obj = {
    component,
    filePath: path.join(__dirname, '..', fileHandler.getFileStoragePath()),

  };
  console.log(component);
  res.status(200).json({ data: obj });
});

apiRouter.post('/saveFiles', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      res.status(500).json({ message: `Unexpected error: ${err.message}` });
    } else {
      console.log('File uploaded successfully!');
      // console.log(printObject(req.files))
      fileHandler.storeNewFile(req.files);
      res.status(200).json({ message: 'File uploaded successfully!' });
    }
  });
});

apiRouter.post('/addComponent', (req, res) => {
  console.log('addComponent called');
  printObject(req.body);
  // console.log("len: " + req.body.data.files.length);

  // Add part number to the file object
  const newArr = req.body.data.files;
  for (let i = 0; i < req.body.data.files.length; i += 1) {
    newArr[i].partNum = req.body.data.id;
  }

  console.log('Adding to storing queue:');
  printObject(newArr);

  fileHandler.addFileToStoringQueue(newArr);
  fileHandler.waitStoragingDone(newArr);

  try {
    db.insertComponent(req.body);
    res.status(200).json({ message: 'success' });
  } catch (err) {
    console.log(`POST /addComponent: Database call failed! Error: ${err}`);
    res.status(500).json({ message: 'Database call failed!' });
  }
});

apiRouter.post('/editComponent', (req, res) => {
  console.log('editComponent called');
  printObject(req.body);
  res.status(200).json({ message: 'success' });
});

/*
apiRouter.get('/downloadFile/:partNum/:filename', function (req, res) {
    const { partNum, filename } = req.params;
    console.log("getting file: "+ filename + " for part number: " + partNum);
    res.download(path.join('./public/uploads/ytdl.exe'), function (err) {
        console.log(err);
    });
}); */

apiRouter.get('/getFile/:partNum/:filename', (req, res) => {
  const { partNum, filename } = req.params;
  console.log(`getting file: ${filename} for part number: ${partNum}`);

  console.log(`Path: ${path.join(__dirname, '..', 'fileStorage', partNum, filename)}`);
  // res.download(path.join(__dirname, '..', 'fileStorage', partNum, filename), function (err) {
  res.download(`./fileStorage/${partNum}/${filename}`, (err) => {
    if (err) {
      console.log(`Error: ${err}`);
    }
  });
});

apiRouter.get('/getFiles/:partNum', (req, res) => {
  const { partNum } = req.params;
  console.log(`Getting files for part number: ${partNum}`);
  console.log(`path: ${__dirname}`);
  res.sendFile(`${__dirname}/ohYouDog.PNG`);
});

apiRouter.get('/getFileHeaders/:partNum', async (req, res) => {
  const { partNum } = req.params;
  console.log(`Getting file headers for part number: ${partNum}`);
  const files = await fileHandler.getFileHeaders(partNum);
  console.log(files);
  res.status(200).json({ files });
});

apiRouter.get('/test', (req, res) => {
  console.log('File queue:');
  fileHandler.logFileQueue();

  console.log('Stored files:');
  fileHandler.logStoredFiles();

  res.status(200).json({ message: 'success' });
});

apiRouter.get('/getPartnumber/:type', async (req, res) => {
  const { type } = req.params;
  console.log(`Getting next available part number for item type: ${type}`);

  const ret = await db.getNextAvailablePartNum(type);

  res.status(200).json({ partNum: ret });
});

apiRouter.get('/getPartnumbers', async (req, res) => {
  const ret = await db.getNextAvailablePartNums();
  console.log(ret);
  res.status(200).json({ partNums: ret });
});

module.exports = apiRouter;
