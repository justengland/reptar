var CODE_FILE = 'code.phantom.js';
var fs = require('fs');

module.exports.saveCodeFile = saveCodeFile;

function saveCodeFile(sessionId, phantomCode, onComplete) {
  console.log('save file');
  var dir = './client/out/' + sessionId;

  function onDirectoryReady(err) {
    if (err) throw err;

    var fileName = dir + '/' +  CODE_FILE;
    //// Write Code to file
    fs.writeFile(fileName, phantomCode, function (err) {
      if (err) throw err;
      onComplete(dir, CODE_FILE);
    });
  }

  // Make a directory for the output
  fs.stat(dir, function (err, stats) {
    if (err) {
      if (err.code == 'ENOENT') {
        fs.mkdir(dir, onDirectoryReady);
      }
      else {
        throw err
      }
    }
    else {
      onDirectoryReady();
    }
  });
}

