var server = require('http').createServer();
var url = require('url');
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ server: server });
var express = require('express');
var app = express();
var port = 3000;
var fs = require('fs');
var isWin = /^win/.test(process.platform);
var path = require('path');
var shortid = require('shortid');
var output = require('./output.js');
var hound = require('hound');


app.use(express.static('client'));

app.use(function (req, res) {
  res.send({ msg: "hello" });
});

wss.on('connection', function connection(ws) {    
  var location = url.parse(ws.upgradeReq.url, true);
  console.log('location:', location);

  var sessionId = shortid.generate();
  console.log(sessionId);

  // you might use location.query.access_token to authenticate or share sessions
  // or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

  ws.on('message', function incoming(message) {

    console.log('received: %s', message);
    ws.send('received');
        
    var obj = JSON.parse(message);
    ws.send(obj.nickname);
    ws.send(obj.msg);

    // Handle Messages - this is really like a middleware, if you want to subscribe to the 
    executePhantom(ws, obj, sessionId, onPhantomComplete);

  });

  sendJSONToConsole(ws, { stdout: 'server connected' });
});

function executePhantom(ws, message, sessionId, onComplete) {

  function onFileSaved(dir, fileName) {
    console.log('It\'s saved!');

    var watcher = hound.watch(dir);
    watcher.on('create', function(file, stats) {
      var message = {
        fileMode: 'create',
        file: file,
        size: stats.size,
        mtime: stats.mtime
      };
      sendJSONInfo(ws, message);
      console.log('create', file, stats);
    });
    watcher.on('change', function(file, stats) {
      var message = {
        fileMode: 'change',
        file: file,
        size: stats.size,
        mtime: stats.mtime
      };
      sendJSONInfo(ws, message);
      console.log('change', file, stats);
    });
    watcher.on('delete', function(file) {
      var message = {
        fileMode: 'delete',
        file: file,
      }
      sendJSONInfo(ws, message);
      console.log('delete', file)
    });

    spawnPhantom(ws, dir, fileName);
  }

  if(ws && message && message.phantomCode && onComplete) { 
    console.log('executePhantom called');
    var phantomCode = message.phantomCode;

    output.saveCodeFile(sessionId, phantomCode, onFileSaved);
  }
}

function onPhantomComplete() {
  console.log('onPhantomComplete');
}

// launch a basic shell command
function spawnPhantom(ws, dir, file) {
  if(!ws.hasSpawnProcess) {
      var spawn = require('child_process').spawn;
      // for linxu - var terminal = require('child_process').spawn('bash');

      // Execute phantom
      if(isWin) {
        var phantomCommand = "phantomjs " + file;
        var child = spawn('cmd', ['/c', phantomCommand], {cwd: dir});
      }
      else {
        console.log('---->linux')
        var filePath = path.join(__dirname, '../', file);
        var child = spawn('phantomjs', [filePath], {cwd: dir})
      }

      child.stdout.on('data', function(data) {
          var message = {
            stdout: data.toString()
          }
          console.log('stdout: ' + data);
          sendJSONToConsole(ws, message);
          //Here is where the output goes
      });
      
      child.stderr.on('data', function(data) {
        var message = {
            stdout: "ERROR: " + data
          }
          console.log('stderr: ' + data);
          sendJSONToConsole(ws, message);
      });
      
      child.on('close', function(code) {
          console.log('closing code: ' + code);
          var message = {
            stdout: "Closed: " + code
          }
          sendJSONToConsole(ws, message);
      });
  }
  else {

  }

}

function sendJSONToConsole(ws, message) {
    message.console = true;
    var serilizedMessage = JSON.stringify(message);
    ws.send(serilizedMessage);
}

function sendJSONInfo(ws, message) {
  message.console = false;
  var serilizedMessage = JSON.stringify(message);
  ws.send(serilizedMessage);
}

server.on('request', app);
server.listen(port, function () { console.log('Listening on ' + server.address().port) });