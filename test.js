var spawn = require('child_process').spawn;
// for linxu - var terminal = require('child_process').spawn('bash');
var child = spawn('cmd', ['/c', 'ping www.bing.com'])

child.stdout.on('data', function(data) {
    console.log('stdout: ' + data);
    //Here is where the output goes
});

child.stderr.on('data', function(data) {
    console.log('stderr: ' + data);
});

child.on('close', function(code) {
    console.log('closing code: ' + code);
});