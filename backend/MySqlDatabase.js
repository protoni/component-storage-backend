const mysql = require('mysql');
const mysql2 = require('mysql2/promise');
const rp = require('request-promise');
const util = require('util');

function printObject(obj) {
    console.log(util.inspect(obj, false, null, true /* enable colors */))
}

class Database {
    constructor(host, user, password, dbName) {
        this.host = host;
        this.user = user;
        this.password = password;
        this.dbName = dbName;
        this.blogPostTable = "blog_posts";
        this.storageTable = "storage_components";
        this.connection;
        this.init();
    }

    async init() {
        let setDbOk;
        let initTablesOk;
        
        let conn = mysql.createConnection({
            host: this.host,
            user: this.user,
            password: this.password
          }
        );
        console.log("connection: " + printObject(conn))
        conn.connect(function(err) {
            console.log("-----------------")
            if (err) {
                console.error('error connecting: ' + err.stack);
                return;
            }
 
            console.log('connected as id ' + conn.threadId);
        });
        
        this.connection = conn;
        
        setDbOk = await this.setDatabase();
        initTablesOk = await this.initTables();
        
        if(setDbOk && initTablesOk) {
            console.log("Database initialized successfully!")
        } else {
            console.log("Database initialization failed!")
        }
    }

    query(sql, args) {
        console.log("query: " + sql);
        return new Promise((resolve, reject) => {
            this.connection.query(sql, args, (err, rows) => {
                if(err) {
                    console.log("err: " + err);
                    return reject(err);
                }
                resolve(rows);
            })
        }).catch(error => {
            console.log("mysql error: " + error.message);
            return 0;
        })
    }

    close() {
        return new Promise((resolve, reject) => {
            this.connection.end(err => {
                if(err) {
                    return reject(err);
                }
                resolve();
            })
        }).catch(error => {
            return 0;
        })
    }

    async initTables() {
        return await this.initComponentStorageTable();
    }

    async initComponentStorageTable() {
        let query = `CREATE TABLE IF NOT EXISTS ` + this.storageTable + ` (
            id INT AUTO_INCREMENT PRIMARY KEY, 
            productId VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL, 
            description TEXT,
            manufacturer VARCHAR(255) NOT NULL,
            quantity INT,
            package VARCHAR(255) NOT NULL, 
            location VARCHAR(255) NOT NULL, 
            created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        console.log("query: " + query)
        return await this.checkTable(this.storageTable, query);
    }
    
    async insertComponent(component) {
        let query = "INSERT INTO " + this.storageTable + 
        " (productId, name, description, manufacturer, quantity, package, location) VALUES "+ 
        "('" + component.data.id + 
        "','" + component.data.name +
        "','" + component.data.description +
        "','" + component.data.manufacturer +
        "','" + component.data.quantity +
        "','" + component.data.package +
        "','" + component.data.location +
        "')";
        let queryOk = await this.query(query);
        if(queryOk != 0) {
            console.log("Successfully inserted a row to a table: " + this.storageTable + "!");
        } else {
            console.log("Failed to insert a row to a table: " + this.storageTable + "! Query: " + query);
            return false;
        }

        return true;
    }
    
    async setDatabase() {
        let dbOk = await this.selectDatabase(this.dbName);
        if(dbOk == 0) {
            console.log("Database: " + this.dbName + " doesn't exist! Creating..");
            let createOk = await this.createDatabase(this.dbName);
            if(createOk != 0) {
                console.log("Successfully created a new database!");
                dbOk = await this.selectDatabase(this.dbName);
                if(!dbOk) {
                    console.log("Failed to connect to newly created database: " + this.dbName);
                } else {
                    console.log("Successfully connected to newly created database: " + this.dbName);
                }
            } else {
                console.log("Failed to create a new database!");
                return false;
            }
        }
        return true;
    }

    async createTable(query, name) {
        //console.log("query: " + query);
        let createOk = await this.query(query);
        if(createOk != 0) {
            console.log("Successfully created a new table: " + name + "!");
        } else {
            console.log("Failed to create a new table: " + name + "!");
            return false;
        }

        return true;
    }

    async checkTable(name, query) {
        if(!await this.tableExists(name)) {
            return await this.createTable(query, name);
        }

        return true;
    }

    printObject(obj) {
        console.log(util.inspect(obj, false, null, true /* enable colors */))
    }

    async tableExists(name) {
        let query = `
            SELECT * FROM information_schema.tables 
            WHERE table_schema = '` + this.dbName + `' 
            AND table_name = '` + name + `'
        ;`;
        let exists = await this.query(query);
        if(exists.length > 0) {
            return true;
        } else {
            return false;
        }
    }

    async createDatabase(name) {
        console.log("dbg1");
        return await this.query("CREATE DATABASE IF NOT EXISTS " + name);
    }

    async selectDatabase(name) {
        console.log("dbg2");
        return await this.query("USE " + name);
    }

    async postExists(name) {
        let query = `
            select * from ` + this.blogPostTable + ` 
            where title='` + name + `' 
        `;
        let ret = await this.query(query);
        if(ret.length > 0) {
            return true;
        } else {
            return false;
        }
    }

    async savePost(obj) {
        if(await this.postExists(obj.filename)) {
            let query = `UPDATE ` + this.blogPostTable + ` 
                set content='` + JSON.stringify(obj) + `'
                where title='` + obj.filename + `' 
            `;
            let ret = await this.query(query);
            if(ret != 0) {
                console.log("update ok")
            } else {
                console.log("update not ok");
            }
        } else {
            console.log("this.blogPostTable: " + this.blogPostTable);
            console.log("obj.filename: " + obj.filename);
            console.log("JSON.stringify(obj): " + JSON.stringify(obj));
            
            let json = JSON.stringify(obj);
            json = json.replace(/\\n/g, '');
            console.log("json after: " + json)
            let query = `INSERT INTO ` + this.blogPostTable + ` 
                (title, content, status) VALUES ('` + obj.filename + 
                `', '`+ json + `', '1') 
            `;
            console.log(query);
            let ret = await this.query(query);
            if(ret != 0) {
                console.log("insert ok")
            } else {
                console.log("insert not ok");
            }
        }
    }

    async loadPost(title) {
        if(await this.postExists(title)) {
            let query = `SELECT * FROM ` + this.blogPostTable + ` 
                where title='` + title + `' 
            `;
            let ret = await this.query(query);
            if(ret != 0) {
                console.log("fetch post ok")
                return ret;
            }
        }
        
        console.log("fetch post fail")
        return null;
    }
}

module.exports = Database;