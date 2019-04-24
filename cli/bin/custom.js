#!/usr/bin/env node
var fs = require('fs')
var path = require('path')
var now_path = process.cwd()

var fs_run = {
  store (name, typ) {
    let fileName = `${name}.${typ}`

    fs.writeFile(path.join(now_path, `./${fileName}`), fileName, (err) => {
      if (err) throw err
      console.log('store file success')
    })
  }
}

function run ([typ, action, ...arg]) {
  switch (typ) {
    case '-f':  
      fs_run[action] && fs_run[action].apply(null, arg)
      break;
    default :
      console.log('no this operate');
  }
}

run(process.argv.slice(2))