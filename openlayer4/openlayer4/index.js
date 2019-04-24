var http = require('http')
var fs = require('fs')
var url = require('url')
var path = require('path')
var mime = require('mime')
var staticPath = path.resolve(__dirname, './')

var server = http.createServer(function (req, res) {
  var pathname = url.parse(req.url).pathname
  var filepath = path.join(staticPath, pathname)
  var mimetype = mime.getType(pathname)

  fs.readFile(filepath, 'binary', function (err, fileContent) {
    if (err) {
      res.writeHeader(404, 'not found')
      res.end('<h1>404 not found</h1>')
    } else {
      res.setHeader('content-type', `${mimetype};charset=utf-8`)
      res.write(fileContent, 'binary')
      res.end()
    }
  })
})

server.listen(8084)
console.log('visit http://lcoalhost:8084')