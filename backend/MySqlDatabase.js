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
        this.connection;
        this.init();
    }

    async init() {
        let setDbOk;
        let initTablesOk;
        
        let connection = mysql.createConnection({
            host: this.host,
            user: this.user,
            password: this.password
          }
        );
        console.log("connection: " + printObject(connection))
        connection.connect(function(err) {
            console.log("-----------------")
            if (err) {
                console.error('error connecting: ' + err.stack);
                return;
            }
 
            console.log('connected as id ' + connection.threadId);
        });
        
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
        return await this.initBlogPostsTable();
    }

    async initBlogPostsTable() {
        let query = `CREATE TABLE IF NOT EXISTS ` + this.blogPostTable + ` (
            id INT AUTO_INCREMENT PRIMARY KEY, 
            title VARCHAR(255) NOT NULL, 
            content TEXT, 
            created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
            status TINYINT NOT NULL
        )`;
        return await this.checkTable(this.blogPostTable, query);
    }

    async setDatabase() {
        let dbOk = await this.selectDatabase(this.dbName);
        if(dbOk == 0) {
            console.log("Database: " + this.dbName + " doesn't exist! Creating..");
            let createOk = await this.createDatabase(this.dbName);
            if(createOk != 0) {
                console.log("Successfully created a new database!");
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
        return await this.query("CREATE DATABASE IF NOT EXISTS " + name);
    }

    async selectDatabase(name) {
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