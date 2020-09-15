let express = require("express");
let apiRouter = express.Router();
let d3 = require("d3");
const util = require('util');
const database = require('./MySqlDatabase.js');
const readlineSync = require('readline-sync');
//const mongodb = require('./MongoDbDatabase.js');

// Get the MySQL password
function promptPassword() {
    var pw = readlineSync.question('Password: ', {hideEchoBack: true});
    return pw;
}
let password = promptPassword();

// Init MySQL database
const db = new database("localhost", "root2", password, "test");

// Temp. Current saved blog file names.
global.savedFiles = [];

function addToFileList(req) {
    console.log("len: " + req.body.data.length)
    
    let rowCount = req.body.data.length;
    if(rowCount > 0) {
        let file = req.body.filename;
        if(file != "Untitled") {
            console.log("file: " + file)
            console.log("saved files: " + savedFiles);
            if (!savedFiles.includes(file)) {
                console.log("pushing")
                savedFiles.push(file);
            }
        }
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

const fs = require('fs'); 
const configFile = "C:/work/git/binance-market-analyzer/candles/ETH/1d";

function creatCandleObject(data) {
    row = data.split(',')

    if(row.length === 13) {
        let converted = d3.timeFormat("%Y-%m-%d:%H-%M-%s")
        
        return {
            'absoluteChange': '',
            'close': row[4],
            'date': converted(row[6]),
            'dividend': '',
            'high': row[2],
            'low': row[3],
            'open': row[1],
            'percentageChange': '',
            'split': '',
            'volume': row[5]
        }
    }

    return null;
}

function createCandleData(raw) {
    items = raw.split('\n')
    console.log("items len: " + items.length)
    pages = []
    page = []
    pagingCounter = 0
    paging = 99
    errors = 0
    for(let i = 0; i < items.length; i++) {
        obj = creatCandleObject(items[i])
        
        if(obj != null) {
            pages.push(obj)
            /*
            if(pagingCounter++ >= paging) {
                //console.log(page)
                pages.push(page)
                page = []
                pagingCounter = 0
            }
            */
        } else {
            errors++;
        }

    }

    console.log("pages len: " + pages.length)
    console.log("errors: " + errors)

    return pages
}

function readCandleData() {
    if(fs.existsSync(configFile)) {
        let raw = fs.readFileSync(configFile).toString('utf-8');
        //let json = JSON.parse(raw);
        
        return createCandleData(raw);
    } else {
        return null;
    }
}

apiRouter.get('/candle', function(req, res) {
    console.log("get Candle data")
    data = readCandleData()
    printObject(data)
    res.status(200).json({"data":data})
})

apiRouter.post('/test', function(req, res) {
    //console.log("test called. req:" + printObject(req.body));
    res.status(200).json({"message":"success"})
})

apiRouter.post('/save', function(req, res) {
    //console.log("save called. req:" + printObject(req.body));
    try {
        //mongodb.save(req.body);
        /*
        addToFileList(req)
        db.savePost(req.body);
        console.log(req.body);
        console.log("saved files: " + savedFiles);*/
        res.status(200).json({"message":"success"})
    } catch(err) {
        console.log("POST /save: Database call failed! Error: " + err)
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