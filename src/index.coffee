fs = require 'fs'

exports.createProxy      =    require("./http_proxy").createProxy
exports.createHttpsProxy =    require("./https_proxy").createProxy

fs.readdirSync(__dirname + '/middleware').forEach (filename) ->
  if (/\.js$/.test(filename))
    name = filename.substr(0, filename.lastIndexOf('.'))
    exports.__defineGetter__ name, ->
      return require('./middleware/' + name)

# HTTPS DNS lookup errors throw an exception which
# it difficult to catch
process.on 'uncaughtException', (err)->
  console.log(err["message"])

