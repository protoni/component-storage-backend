/* eslint-disable no-console */
const fs = require('fs');
const util = require('util');
const moveFile = require('./utils/moveFile.js');

/* Helpers */
function printObject(obj) {
  console.log(util.inspect(obj, false, null, true /* enable colors */));
}

function createFolder(name) {
  if (!fs.existsSync(name)) {
    fs.mkdirSync(name);
    return 1;
  }

  return 0;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function move(oldPath, newPath) {
  moveFile(oldPath, newPath);
}

// How long the upload and relocation of the uploaded files can last. ( sconds )
const FILE_STORAGING_TIMEOUT = 60;

class FileHandler {
  constructor(uploadDir) {
    this.fileStorage = './fileStorage/';
    this.uploadDir = uploadDir;
    this.initStorageFolder();
    this.storedFiles = [];
    this.filesToStore = [];
    moveFile();
  }

  initStorageFolder() {
    if (createFolder(this.fileStorage)) {
      console.log(`File storage folder missing! Created a new file storage folder: ${this.fileStorage}`);
    }
  }

  getFileStoragePath() {
    return this.fileStorage;
  }

  addFileToStoringQueue(files) {
    for (let i = 0; i < files.length; i += 1) {
      this.filesToStore.push(files[i]);
    }
    console.log(`Added ${files.length} files to storing queue!`);
  }

  removeFileFromStoringQueue(file) {
    const newQueue = [];

    for (let i = 0; i < this.filesToStore.length; i += 1) {
      if (file !== this.filesToStore[i].name) {
        if (!newQueue.includes(this.filesToStore[i].name)) {
          newQueue.push(this.filesToStore[i]);
        }
      }
    }

    this.filesToStore = newQueue;
  }

  checkIfFileStored(file) {
    for (let i = 0; i < this.storedFiles.length; i += 1) {
      if (this.storedFiles[i].filename === file.name
            && this.storedFiles[i].partNum === file.partNum) {
        return true;
      }
    }

    return false;
  }

  async waitStoragingDone(data) {
    for (let i = 0; i < FILE_STORAGING_TIMEOUT; i += 1) {
      for (let j = 0; j < data.length; j += 1) {
        if (this.filesToStore.length === 0) {
          return 1;
        }

        if (this.checkIfFileStored(data[j])) {
          this.removeFileFromStoringQueue(data[j].name);
        }
      }
      // eslint-disable-next-line no-await-in-loop
      await sleep(1000);
    }

    return 0;
  }

  getPartNumFromFileToStore(file) {
    console.log(this.filesToStore);
    for (let i = 0; i < this.filesToStore.length; i += 1) {
      if (file[0].filename.includes(this.filesToStore[i].name)
                && this.filesToStore[i].size === file[0].size) {
        return this.filesToStore[i].partNum;
      }
    }

    return null;
  }

  storeFile(file, partNum) {
    createFolder(this.fileStorage + partNum);
    const newPath = `${this.fileStorage + partNum}/`;
    move(this.uploadDir + file.filename, newPath + file.filename);
  }

  async storeNewFile(files) {
    let partNum = null;
    for (let i = 0; i < FILE_STORAGING_TIMEOUT; i += 1) {
      partNum = this.getPartNumFromFileToStore(files);
      if (partNum !== null) {
        console.log('dbg4');
        for (let j = 0; j < files.length; j += 1) {
          console.log('dbg5');
          this.storeFile(files[j], partNum);
          console.log('dbg6');
          const obj = {
            partNum,
            filename: files[j].filename,
            size: files[j].size,
          };
          this.storedFiles.push(obj);
        }
        return 1;
      }
      // eslint-disable-next-line no-await-in-loop
      await sleep(1000);
    }

    console.log('Failed to store a file. Timeout.');
    return 0;
  }

  getFileHeaders(partNum) {
    const fileLocation = `${this.fileStorage + partNum}/`;
    const fileList = [];

    fs.readdirSync(fileLocation).forEach((file) => {
      fileList.push(file);
    });

    return fileList;
  }

  logFileQueue() {
    printObject(this.filesToStore);
  }

  logStoredFiles() {
    printObject(this.storedFiles);
  }

  deleteFiles(partNum, deletedFiles) {
    try {
      const fileLocation = `${this.fileStorage + partNum}/`;
      fs.readdirSync(fileLocation).forEach((file) => {
        if (deletedFiles.includes(file)) {
          const path = fileLocation + file;
          console.log(`Deleting file: ${path}`);
          fs.unlinkSync(path);
          console.log(`Deleted file: ${path}`);
        }
      });
    } catch (err) {
      console.log('Failed to delete files!');
    }
  }
}

module.exports = FileHandler;
