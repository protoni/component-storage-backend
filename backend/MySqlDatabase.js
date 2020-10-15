/* eslint-disable no-console */
const mysql = require('mysql');
const util = require('util');

function printObject(obj) {
  console.log(util.inspect(obj, false, null, true /* enable colors */));
}

class Database {
  constructor(host, user, password, dbName) {
    this.host = host;
    this.user = user;
    this.password = password;
    this.dbName = dbName;
    this.blogPostTable = 'blog_posts';
    this.storageTable = 'storage_components';
    this.connection = null;
    this.partNumLength = 8;
    this.partNumTypeLength = 1;
    this.init();
  }

  async init() {
    let setDbOk = false;
    let initTablesOk = false;

    const conn = mysql.createConnection({
      host: this.host,
      user: this.user,
      password: this.password,
    });
    console.log(`connection: ${printObject(conn)}`);
    conn.connect((err) => {
      console.log('-----------------');
      if (err) {
        console.error(`error connecting: ${err.stack}`);
        return;
      }

      console.log(`connected as id ${conn.threadId}`);
    });

    this.connection = conn;

    setDbOk = await this.setDatabase();
    initTablesOk = await this.initTables();

    if (setDbOk && initTablesOk) {
      console.log('Database initialized successfully!');
    } else {
      console.log('Database initialization failed!');
    }
  }

  query(sql, args) {
    // console.log(`query: ${sql}`);
    return new Promise((resolve, reject) => {
      this.connection.query(sql, args, (err, rows) => {
        if (err) {
          console.log(`err: ${err}`);
          return reject(err);
        }
        resolve(rows);
      });
    }).catch((error) => {
      console.log(`mysql error: ${error.message}`);
      return 0;
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.connection.end((err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    }).catch((error) => 0);
  }

  async initTables() {
    const ret = await this.initComponentStorageTable();
    return ret;
  }

  async initComponentStorageTable() {
    const query = `CREATE TABLE IF NOT EXISTS ${this.storageTable} (
            id INT AUTO_INCREMENT PRIMARY KEY, 
            productId VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL, 
            description TEXT,
            manufacturer VARCHAR(255) NOT NULL,
            quantity INT,
            package VARCHAR(255) NOT NULL,
            location VARCHAR(255) NOT NULL,
            thumbnail VARCHAR(255) NOT NULL,
            type VARCHAR(45) NOT NULL,
            comment TEXT,
            category VARCHAR(255) NOT NULL,
            created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
    console.log(`query: ${query}`);
    const ret = await this.checkTable(this.storageTable, query);
    return ret;
  }

  async insertComponent(component) {
    const query = `INSERT INTO ${this.storageTable
    } (productId, name, description, manufacturer, quantity, package, location, thumbnail, type, comment, category) VALUES `
        + `('${component.data.id
        }','${component.data.name
        }','${component.data.description
        }','${component.data.manufacturer
        }','${component.data.quantity
        }','${component.data.package
        }','${component.data.location
        }','${component.data.thumbnail
        }','${component.data.type
        }','${component.data.comment
        }','${component.data.category
        }')`;
    const queryOk = await this.query(query);
    if (queryOk !== 0) {
      console.log(`Successfully inserted a row to a table: ${this.storageTable}!`);
    } else {
      console.log(`Failed to insert a row to a table: ${this.storageTable}! Query: ${query}`);
      return false;
    }

    return true;
  }

  async editComponent(component) {
    const query = `
    UPDATE ${this.storageTable} SET 
    name='${component.data.name}',
    description='${component.data.description}',
    manufacturer='${component.data.manufacturer}',
    quantity='${component.data.quantity}',
    package='${component.data.package}',
    location='${component.data.location}',
    thumbnail='${component.data.thumbnail}',
    comment='${component.data.comment}',
    category='${component.data.category}' WHERE 
    productId='${component.data.id}'`;

    const queryOk = await this.query(query);
    if (queryOk !== 0) {
      console.log(`Successfully edited a row in a table: ${this.storageTable}!`);
    } else {
      console.log(`Failed to edit a row in a table: ${this.storageTable}! Query: ${query}`);
      return false;
    }

    return true;
  }

  async getComponents() {
    const query = `SELECT * FROM ${this.storageTable}`;
    const ret = await this.query(query);
    if (ret !== 0) {
      console.log(`Successfully got * from table: ${this.storageTable}!`);
      return ret;
    }
    console.log(`Failed to get * from table: ${this.storageTable}! Query: ${query}`);
    return false;
  }

  async getComponent(id) {
    const query = `SELECT * FROM ${this.storageTable} WHERE productId='${id}'`;
    const ret = await this.query(query);
    if (ret !== 0) {
      console.log(`Successfully got productId ${id} from table: ${this.storageTable}!`);
      return ret;
    }
    console.log(`Failed to get productId ${id} from table: ${this.storageTable}! Query: ${query}`);
    return false;
  }

  async setDatabase() {
    let dbOk = await this.selectDatabase(this.dbName);
    if (dbOk === 0) {
      console.log(`Database: ${this.dbName} doesn't exist! Creating..`);
      const createOk = await this.createDatabase(this.dbName);
      if (createOk !== 0) {
        console.log('Successfully created a new database!');
        dbOk = await this.selectDatabase(this.dbName);
        if (!dbOk) {
          console.log(`Failed to connect to newly created database: ${this.dbName}`);
        } else {
          console.log(`Successfully connected to newly created database: ${this.dbName}`);
        }
      } else {
        console.log('Failed to create a new database!');
        return false;
      }
    }
    return true;
  }

  async createTable(query, name) {
    // console.log("query: " + query);
    const createOk = await this.query(query);
    if (createOk !== 0) {
      console.log(`Successfully created a new table: ${name}!`);
    } else {
      console.log(`Failed to create a new table: ${name}!`);
      return false;
    }

    return true;
  }

  async checkTable(name, query) {
    if (!await this.tableExists(name)) {
      const ret = await this.createTable(query, name);
      return ret;
    }

    return true;
  }

  // eslint-disable-next-line class-methods-use-this
  printObject(obj) {
    console.log(util.inspect(obj, false, null, true /* enable colors */));
  }

  async tableExists(name) {
    const query = `
            SELECT * FROM information_schema.tables 
            WHERE table_schema = '${this.dbName}' 
            AND table_name = '${name}'
        ;`;
    const exists = await this.query(query);
    if (exists.length > 0) {
      return true;
    }
    return false;
  }

  async createDatabase(name) {
    const ret = await this.query(`CREATE DATABASE IF NOT EXISTS ${name}`);
    return ret;
  }

  async selectDatabase(name) {
    const ret = await this.query(`USE ${name}`);
    return ret;
  }

  async postExists(name) {
    const query = `
            select * from ${this.blogPostTable} 
            where title='${name}' 
        `;
    const ret = await this.query(query);
    if (ret.length > 0) {
      return true;
    }
    return false;
  }

  async savePost(obj) {
    if (await this.postExists(obj.filename)) {
      const query = `UPDATE ${this.blogPostTable} 
                set content='${JSON.stringify(obj)}'
                where title='${obj.filename}' 
            `;
      const ret = await this.query(query);
      if (ret !== 0) {
        console.log('update ok');
      } else {
        console.log('update not ok');
      }
    } else {
      console.log(`this.blogPostTable: ${this.blogPostTable}`);
      console.log(`obj.filename: ${obj.filename}`);
      console.log(`JSON.stringify(obj): ${JSON.stringify(obj)}`);

      let json = JSON.stringify(obj);
      json = json.replace(/\\n/g, '');
      console.log(`json after: ${json}`);
      const query = `INSERT INTO ${this.blogPostTable} 
                (title, content, status) VALUES ('${obj.filename
}', '${json}', '1') 
            `;
      console.log(query);
      const ret = await this.query(query);
      if (ret !== 0) {
        console.log('insert ok');
      } else {
        console.log('insert not ok');
      }
    }
  }

  async loadPost(title) {
    if (await this.postExists(title)) {
      const query = `SELECT * FROM ${this.blogPostTable} 
                where title='${title}' 
            `;
      const ret = await this.query(query);
      if (ret !== 0) {
        console.log('fetch post ok');
        return ret;
      }
    }

    console.log('fetch post fail');
    return null;
  }

  // eslint-disable-next-line class-methods-use-this
  async generateNextPartNum(type, currentPartNum) {
    let idx = 1;

    // Parse current part index
    if (currentPartNum !== 0) {
      let num = '';
      let start = false;
      for (let i = 0; i < currentPartNum.length; i += 1) {
        // Check if numeric and above 0
        if (!isNaN(currentPartNum[i] - parseFloat(currentPartNum[i]))
          && currentPartNum[i] > 0) {
          start = true;
        }

        if (start) {
          num += currentPartNum[i];
        }
      }
      idx = parseInt(num) + 1;
    }

    // console.log(`Generating next part num! next idx: ${idx}`);

    // Get current part index number length
    const idxLen = idx.toString().length;

    // Calculate null padding length
    const nullPadding = this.partNumLength - (this.partNumTypeLength + idxLen);

    // Add type indicator to the part number
    let partNum = '';
    if (type === 'board') {
      partNum += 'A';
    } else if (type === 'component') {
      partNum += 'B';
    } else if (type === 'misc') {
      partNum += 'C';
    } else {
      console.log('Eror! Unknown type.');
      return '';
    }

    // Add null padding to the part number
    for (let i = 0; i < nullPadding; i += 1) {
      partNum += '0';
    }

    // Add index to the part number
    partNum += idx.toString();

    // console.log(`Generated new part num: ${partNum}`);
    return partNum;
  }

  async getNextAvailablePartNum(type) {
    const query = `SELECT * FROM ${this.storageTable} WHERE type='${type}' ORDER BY productId desc LIMIT 1`;
    let ret = await this.query(query);
    if (ret !== 0) {
      // console.log(`Successfully got * from table: ${this.storageTable}! where type=${type}`);

      if (ret.length === 0) {
        // console.log('array empty!');
        ret = this.generateNextPartNum(type, 0);
      } else {
        ret = this.generateNextPartNum(type, ret[0].productId);
      }

      return ret;
    }
    console.log(`Failed to get * from table: ${this.storageTable} where type=${type}! Query: ${query}`);
    return '';
  }

  async getNextAvailablePartNums() {
    const partNumbers = [];

    const query = `SELECT DISTINCT type FROM ${this.storageTable}`;
    let ret = await this.query(query);
    if (ret !== 0) {
      for (let i = 0; i < ret.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const partNum = await this.getNextAvailablePartNum(ret[i].type);
        const obj = {
          type: ret[i].type,
          partNum,
        };

        partNumbers.push(obj);
      }
      ret = partNumbers;

      return ret;
    }

    console.log(`Failed to get DISTINCT type FROM: ${this.storageTable}`);
    return [];
  }
}

module.exports = Database;
