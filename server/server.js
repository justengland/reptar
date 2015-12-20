var server = require('http').createServer();
var url = require('url');
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ server: server });
var express = require('express');
var app = express();
var port = 3000;
var fs = require('fs');

app.use(express.static('client'));

app.use(function (req, res) {
  res.send({ msg: "hello" });
});

wss.on('connection', function connection(ws) {    
  var location = url.parse(ws.upgradeReq.url, true);
  console.log('location:', location);
  // you might use location.query.access_token to authenticate or share sessions
  // or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

  ws.on('message', function incoming(message) {

    console.log('received: %s', message);
    ws.send('received');
        
    var obj = JSON.parse(message);
    ws.send(obj.nickname);
    ws.send(obj.msg);

    // Handle Messages - this is really like a middleware, if you want to subscribe to the 
    executePhantom(ws, obj, onPhantomComplete);

    // spawn(ws, obj.msg);
  });

  sendJSON(ws, { stdout: 'server connected' });
});

function executePhantom(ws, message, onComplete) {
  if(ws && message && message.phantomCode && onComplete) { 
    console.log('executePhantom called')   
    var phantomCode = message.phantomCode;
    var PHANTOM_FILE = 'code.phantom.js';
    // Write Code to file
    fs.writeFile(PHANTOM_FILE, phantomCode, function (err) {
      if (err) throw err;
      console.log('It\'s saved!');

      // Execute phantom
      var phantomCommand = "phantomjs " + PHANTOM_FILE;
      spawn(ws, phantomCommand)
    });
  }
}

function onPhantomComplete() {
  console.log('onPhantomComplete');
}

// launch a basic shell command
function spawn(ws, command) {
  if(!ws.hasSpawnProcess) {
      var spawn = require('child_process').spawn;
      // for linxu - var terminal = require('child_process').spawn('bash');
      var child = spawn('cmd', ['/c', command])

      child.stdout.on('data', function(data) {
          var message = {
            stdout: data.toString()
          }
          console.log('stdout: ' + data);
          sendJSON(ws, message);
          //Here is where the output goes
      });
      
      child.stderr.on('data', function(data) {
        var message = {
            stdout: "ERROR: " + data
          }
          console.log('stderr: ' + data);
          sendJSON(ws, message);
      });
      
      child.on('close', function(code) {
          console.log('closing code: ' + code);
          var message = {
            stdout: "Closed: " + code
          }
          sendJSON(ws, message);
      });
  }
  else {

  }

}

function sendJSON(ws, message) {
    var serilizedMessage = JSON.stringify(message);
    ws.send(serilizedMessage);
}

server.on('request', app);
server.listen(port, function () { console.log('Listening on ' + server.address().port) });