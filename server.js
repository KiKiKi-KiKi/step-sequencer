const http = require('http');
const fs   = require('fs');
const path = require('path');
const port = 3000;

const getType = (url) => {
  const extname = path.extname(url);
  const types = {
    ".html": "text/html",
    ".css":  "text/css",
    ".js":   "text/javascript",
    ".png":  "image/png",
    ".gif":  "image/gif",
    ".svg":  "svg+xml",
    "woff2": "font/woff2",
    "woff":  "font/woff",
    "ttf":   "font/ttf",
  }
  return (extname in types)? types[extname] : 'text/plain';
};

const getErrorStatusCode = (err) => {
  let status = 500;
  switch(err.code) {
    case 'ENOENT':
    default:
      status = 404;
    break;
  }
  return status;
};

const pageError = (err, res) => {
  console.log('ERROR!', err, err.code);
  const statusCode = getErrorStatusCode(err);
  res.statusCode = statusCode
  res.writeHead(statusCode, {'Content-Type': 'text/plain'});
  res.end(err.message);
}

const readPage = (url, res) => {
  console.log('> ', url);
  fs.readFile(url, (err, data) => {
    if (!err) {
      res.writeHead(200, {'Content-Type': getType(url)});
      res.end(data);
      return;
    } else {
      fs.stat(url, (err, stats) => {
        if (err) {
          pageError(err, res);
          return;
        }
        if ( stats.isDirectory() ) {
          readPage( path.join(url, 'index.html'), res );
          return;
        }
        pageError(err, res);
      });
    }
  });
};

const server = http.createServer((req, res) => {
  const url = './build/' + path.relative('/', req.url);
  readPage(url, res);
}).listen(port);

console.log(`Server running at http://localhost:${port}/`);
