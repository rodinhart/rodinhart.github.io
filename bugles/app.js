var http = require('http');
var path = require('path');
var fs = require('fs');

http.createServer(function (request, response) {
    var filePath = '.' + request.url;
    if (filePath == './') {
        filePath = './index.html';
    }
         
    var extname = path.extname(filePath);
    var contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;

        case '.css':
            contentType = 'text/css';
            break;
    }
     
    fs.exists(filePath, function(exists) {
        if (exists) {
            fs.readFile(filePath, function(error, content) {
                if (error) {
                    response.writeHead(500);
                    response.end("Something went wrong, we don't know what.");
                }
                else {
                    response.writeHead(200, {'Content-Type': contentType });
                    response.end(content, 'utf-8');
                }
            });
        }
        else {
            response.writeHead(404);
            response.end("The page you requested could not be found.");
        }
    });
}).listen(process.env.VMC_APP_PORT || 1337, null);
console.log('i am listening...');