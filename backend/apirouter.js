let express = require("express");
const path = require('path');
let apiRouter = express.Router();
const fs = require('fs'); 
const util = require('util');
const database = require('./MySqlDatabase.js');
const FileHandler = require('./FileHandler.js');
const readlineSync = require('readline-sync');
var multer  = require('multer')

var UPLOADED_FILE_SUFFIX = "fileUpload";
var UPLOAD_DESTINATION = "./public/uploads/";

// Setup disk storage
const storage = multer.diskStorage({
    destination: UPLOAD_DESTINATION,
    filename: function(req, file, cb){
      cb(null,file.originalname);
    }
  });

// Check File Type
function checkFileType(file, cb){
    const filetypes = /txt|jpeg|jpg|png|gif|zip|pdf/;
    //const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    //const mimetype = filetypes.test(file.mimetype);
    const extname = true;
    const mimetype = true;
    if(mimetype && extname){
      return cb(null,true);
    } else {
      cb('Error: Unsupported filetype!');
    }
  }

// Setup file uploader
const upload = multer({
    storage: storage,
    limits:{fileSize: 100000000},
    fileFilter: function(req, file, cb){
      checkFileType(file, cb);
    }
  }).any('file');

// Get the MySQL password
function promptPassword() {
    var pw = readlineSync.question('Password: ', {hideEchoBack: true});
    return pw;
}
let password = promptPassword();

// Init MySQL database
const db = new database("localhost", "admin", password, "test");

// Temp. Current saved blog file names.
global.savedFiles = [];

// Init FileHandler
const fileHandler = new FileHandler(UPLOAD_DESTINATION);

const configFile = "config.json";

function readFile(filename) {
    if(fs.existsSync(filename)) {
        let raw = fs.readFileSync(filename);
        //let json = JSON.parse(raw);
        console.log("file content: " + raw);
        //return json;
    } else {
        console.log("file: " + filename + " doesn't exist!");
        return null;
    }
}

function printObject(obj) {
    console.log(util.inspect(obj, false, null, true /* enable colors */))
}

apiRouter.get('/getComponents', async function(req, res) {
    console.log("GET component data")
    //let data = {};
    let components = await db.getComponents();
    
    res.status(200).json({"data":components})
})

apiRouter.get('/getComponent/:id', async function(req, res) {
    let id = req.params.id;

    console.log("GET component data for id: " + id)
    let component = await db.getComponent(id);
    component.filePath = path.join(__dirname, '..', fileHandler.getFileStoragePath());
    let obj = {
        component: component,
        filePath: path.join(__dirname, '..', fileHandler.getFileStoragePath()),

    }
    console.log(component)
    res.status(200).json({"data":obj})
})

apiRouter.post('/saveFiles', function(req, res) {
    upload(req, res, (err) => {
        if(err) {
            res.status(500).json({"message": "Unexpected error: " + err.message})
        } else {
            console.log("File uploaded successfully!")
            //console.log(printObject(req.files))
            fileHandler.storeNewFile(req.files);
            res.status(200).json({"message":"File uploaded successfully!"})
        }
    });
})

apiRouter.post('/addComponent', function(req, res) {
    console.log("addComponent called")
    //console.log(printObject(req.body));
    //console.log("len: " + req.body.data.files.length);

    // Add part number to the file object
    let newArr = req.body.data.files;
    for (let i = 0; i < req.body.data.files.length; i++) {
        newArr[i].partNum = req.body.data.id;
    }

    console.log("Adding to storing queue:");
    printObject(newArr);

    fileHandler.addFileToStoringQueue(newArr);
    fileHandler.waitStoragingDone(newArr);

    try {
        db.insertComponent(req.body);
        res.status(200).json({"message":"success"})
    } catch(err) {
        console.log("POST /addComponent: Database call failed! Error: " + err)
        res.status(500).json({"message":"Database call failed!"})
    }
})
/*
apiRouter.get('/downloadFile/:partNum/:filename', function (req, res) {
    const { partNum, filename } = req.params;
    console.log("getting file: "+ filename + " for part number: " + partNum);
    res.download(path.join('./public/uploads/ytdl.exe'), function (err) {
        console.log(err);
    });
}); */

apiRouter.get('/getFile/:partNum/:filename', function (req, res) {
    const { partNum, filename } = req.params;
    console.log("getting file: "+ filename + " for part number: " + partNum);
    
    console.log("Path: " + path.join(__dirname, '..', 'fileStorage', partNum, filename))
    //res.download(path.join(__dirname, '..', 'fileStorage', partNum, filename), function (err) {
        res.download('./fileStorage/' + partNum + '/' + filename, function (err) {
        if (err) {
            console.log("Error: " + err);
        }
    });
});

apiRouter.get('/getFiles/:partNum', (req, res) => {
    const { partNum } = req.params;
    console.log("Getting files for part number: " + partNum);
    console.log("path: " + __dirname);
    res.sendFile(__dirname + '/ohYouDog.PNG');
});

apiRouter.get('/getFileHeaders/:partNum', async (req, res) => {
    const { partNum } = req.params;
    console.log("Getting file headers for part number: " + partNum);
    let files = await fileHandler.getFileHeaders(partNum);
    console.log(files);
    res.status(200).json({'files':files});
});

apiRouter.get('/test', (req, res) => {

    console.log("File queue:");
    fileHandler.logFileQueue();

    console.log("Stored files:");
    fileHandler.logStoredFiles();

    res.status(200).json({'message':'success'});
});

module.exports = apiRouter;