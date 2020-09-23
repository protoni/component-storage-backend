var fs = require('fs');

module.exports = function move(oldPath, newPath, callback) {
    
    if (oldPath === undefined || newPath === undefined) {
        console.log("Error! Path empty");
        return;
    }

    console.log("copying file!");

    fs.rename(oldPath, newPath, function (err) {
        if (err) {
            if (err.code === 'EXDEV') {
                copy();
            } else {
                callback(err);
            }
            return;
        }
        callback();
    });

    function callback(err) {
        if (err !== undefined) {
            console.log("Callback! Error countered! Error: " + err);
        } else {
            console.log("Copied file successfully!");
        }
    }

    function copy() {
        
        var readStream = fs.createReadStream(oldPath);
        var writeStream = fs.createWriteStream(newPath);

        readStream.on('error', callback);
        writeStream.on('error', callback);

        readStream.on('close', function () {
            fs.unlink(oldPath, callback);
        });

        readStream.pipe(writeStream);
    }
}