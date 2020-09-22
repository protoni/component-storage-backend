let express = require("express");
const path = require('path');
let apiRouter = express.Router();
const fs = require('fs'); 
const util = require('util');
const database = require('./MySqlDatabase.js');
const readlineSync = require('readline-sync');
var multer  = require('multer')


// Setup disk storage
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function(req, file, cb){
      cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
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


async function testDB() {
    console.log("testing db");
    //await db.query("use test2");
    //db.selectDatabase("test2");
    //const tables = await db.query("select * from example");
    //printObject(tables);
    //console.log("testing db done. rows: " + tables[1].id);
}

apiRouter.get('/blogName'), function(req, res) {
    res.status(200).json({"filename":blogName})
}


apiRouter.get('/getComponents', async function(req, res) {
    console.log("GET component data")
    //let data = {};
    let components = await db.getComponents();
    console.log("components: " + printObject(components))
    
    res.status(200).json({"data":components})
})

apiRouter.get('/getComponent/:id', async function(req, res) {
    let id = req.params.id;

    console.log("GET component data for id: " + id)
    let component = await db.getComponent(id);
    console.log("component: " + printObject(component))

    res.status(200).json({"data":component})
})

apiRouter.post('/test', function(req, res) {
    //console.log("test called. req:" + printObject(req.body));
    res.status(200).json({"message":"success"})
})

apiRouter.post('/saveFiles', function(req, res) {
    upload(req, res, (err) => {
        if(err) {
            res.status(500).json({"message": "Unexpected error: " + err.message})
        } else {
            console.log("File uploaded successfully!")
            res.status(200).json({"message":"File uploaded successfully!"})
        }
    });
})

apiRouter.post('/addComponent', function(req, res) {
    console.log("addComponent called. req:" + printObject(req.body));
    
    try {
        db.insertComponent(req.body);
        res.status(200).json({"message":"success"})
    } catch(err) {
        console.log("POST /addComponent: Database call failed! Error: " + err)
        res.status(500).json({"message":"Database call failed!"})
    }
})

apiRouter.get('/load/:title', function(req, res) {
    try {
        console.log("/load called!");
        console.log("title: " + req.params.title)
        /*
        let obj = mongodb.load('asd1');
        
        obj.then(data => {
            //printObject(data);
            console.log("obj: "+ data);
            res.status(200).json({"data":data});
        })*/
        /*
        let ret = db.loadPost('React');
        
        ret.then(data => {
            printObject(data);
            console.log("data: " + data);
            res.status(200).json({"data":data})
        })*/
        
    } catch(err) {
        console.log("GET /load: Database call failed! Error: " + err.message)
        res.status(500).json({"message":"Database call failed!"})
    }
})

module.exports = apiRouter;