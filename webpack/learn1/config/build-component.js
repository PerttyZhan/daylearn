// 多模块打包
const path = require('path')
const fs = require('fs')
const webpack = require('webpack')
const merge = require('webpack-merge')
const baseWebpackConfig = require('./webpack.base.js')

const basePath = '../src/out-component'
const configureName = 'index.json'
const moduleName = 'index.vue'

function resolvePath (src) {
  return path.resolve(__dirname, src)
}

function fsSync (action, ...fsParams) {
  return new Promise((resolve, reject) => {
    fs[action](...fsParams, 'utf8', (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

async function webpackComponent (dir) {
  try {
    let dirPath = resolvePath(`${basePath}/${dir}`)
    let destPath = path.join(baseWebpackConfig.output.path, dir)
    let configurePath = path.join(dirPath, configureName)
    let configure = await fsSync('readFile', configurePath)

    fs.copyFile(configurePath, path.join(destPath, configureName))
    fs.readFile()
    configure = JSON.parse(configure)
    let config = merge(baseWebpackConfig, {
      entry: path.join(dirPath, moduleName),
      output: {
        library: configure.library,
        path: destPath
      }
    })
    return config
  } catch (e) {
    throw console.log('没有模块的配置文件')
  }
}

async function init () {
  try {
    let files = await fsSync('readdir', resolvePath(basePath))
    let configs = await Promise.all(files.map(webpackComponent))
    return configs
  } catch (e) {
    throw console.log('没有单独打包的模块')
  }
}

module.exports = init