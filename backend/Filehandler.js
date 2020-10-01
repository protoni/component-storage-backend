const fs = require('fs'); 
const moveFile = require('./utils/moveFile.js');
const util = require('util');

function printObject(obj) {
    console.log(util.inspect(obj, false, null, true /* enable colors */))
}

// How long the upload and relocation of the uploaded files can last. ( sconds )
var FILE_STORAGING_TIMEOUT = 60;

class FileHandler {
    constructor(uploadDir) {
        this.fileStorage = './fileStorage/';
        this.uploadDir = uploadDir
        this.initStorageFolder();
        this.storedFiles = [];
        this.filesToStore = [];
        moveFile();
    }

    initStorageFolder() {
        if (this.createFolder(this.fileStorage)) {
            console.log("File storage folder missing! Created a new file storage folder: " + this.fileStorage);
        }
    }

    getFileStoragePath() {
        return this.fileStorage;
    }

    createFolder(name) {
        if (!fs.existsSync(name)){
            fs.mkdirSync(name);
            return 1;
        }

        return 0;
    }

    addFileToStoringQueue(files) {
        for (let i = 0; i < files.length; i++) {
            this.filesToStore.push(files[i]);
        }
        console.log("Added " + files.length + " files to storing queue!");

    }

    removeFileFromStoringQueue(file) {
        let newQueue = [];
        
        for (let i = 0; i < this.filesToStore.length; i++) {
            if (file !== this.filesToStore[i].name) {
                if (!newQueue.includes(this.filesToStore[i].name)) {
                    newQueue.push(this.filesToStore[i]);
                }
            }
        }
        
        this.filesToStore = newQueue;
    }

    printObject(obj) {
        console.log(util.inspect(obj, false, null, true /* enable colors */))
    }

    checkIfFileStored(file) {
        for (let i = 0; i < this.storedFiles.length; i++) {
            if (this.storedFiles[i].filename === file.name && this.storedFiles[i].partNum == file.partNum) {
                return true;
            }
        }

        return false;
    }

    async waitStoragingDone(data) {
        for(let i = 0; i < FILE_STORAGING_TIMEOUT; i++) {
            for(let j = 0; j < data.length; j++) {
                if (this.filesToStore.length === 0) {
                    return 1;
                }

                if (this.checkIfFileStored(data[j])) {
                    this.removeFileFromStoringQueue(data[j].name);
                }
            }
            await this.sleep(1000);
        }

        return 0;
    }

    sleep(ms) {
        return new Promise((resolve) => {
          setTimeout(resolve, ms);
        });
    } 

    getPartNumFromFileToStore(file) {
        for(let i = 0; i < this.filesToStore.length; i++) {
            if (file[0].filename.includes(this.filesToStore[i].name)  && 
                this.filesToStore[i].size === file[0].size) {
                return this.filesToStore[i].partNum;
            }
        }

        return null;
    }

    storeFile(file, partNum) {
        this.createFolder(this.fileStorage + partNum);
        let newPath = this.fileStorage + partNum + '/'
        this.move(this.uploadDir + file.filename, newPath + file.filename);
    }

    move(oldPath, newPath) {
        moveFile(oldPath, newPath);
    }

    async storeNewFile(files) {
        let partNum = null;
        for(let i = 0; i < FILE_STORAGING_TIMEOUT; i++) {
            partNum = this.getPartNumFromFileToStore(files);
            if (partNum !== null) {
                for (let j = 0; j < files.length; j++) {
                    this.storeFile(files[j], partNum);
                    let obj = {
                        partNum: partNum,
                        filename: files[j].filename,
                        size: files[j].size
                    }
                    this.storedFiles.push(obj);
                }
                return 1;
            }
            await this.sleep(1000);
        }

        console.log("Failed to store a file: " + file.name + '! Timeout.');
        return 0;
    }

    getFileHeaders(partNum) {
        let fileLocation = this.fileStorage + partNum + '/';
        let fileList = [];

        fs.readdirSync(fileLocation).forEach(file => {
            fileList.push(file);
        });

        return fileList;
    }

    logFileQueue() {
        this.printObject(this.filesToStore);
    }

    logStoredFiles() {
        this.printObject(this.storedFiles);
    }

}

module.exports = FileHandler;