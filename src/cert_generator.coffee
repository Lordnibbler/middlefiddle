fs        = require('fs')
path      = require('path')
{spawn}     = require('child_process')
chainGang = require('chain-gang')
chain     = chainGang.create({workers: 1})

generateCerts = (host, callback) ->
  # TODO: Make async
  currentCerts = getCerts(host)
  if currentCerts
    callback(currentCerts)
  else
    console.log("Generating certs for #{host}")
    prc = spawn "#{__dirname}/bin/certgen.sh", [host, Date.now()]
    prc.on 'exit', (code, err) ->
      if code == 0
        callback getCerts(host)
      else
        console.log(err)
        callback getCerts(host)

CERTS_DIR = "#{process.env['HOME']}/.middlefiddle/certs"
getCerts = (host) ->
  if path.existsSync("#{CERTS_DIR}/#{host}.key") && path.existsSync("#{CERTS_DIR}/#{host}.crt")
    tlsOptions =
      key: fs.readFileSync("#{CERTS_DIR}/#{host}.key"),
      cert: fs.readFileSync("#{CERTS_DIR}/#{host}.crt"),
      ca: fs.readFileSync("#{CERTS_DIR}/../ca.crt")
    tlsSettings = require('crypto').createCredentials(tlsOptions)
    tlsSettings.context.setCiphers('RC4-SHA:AES128-SHA:AES256-SHA')
    tlsSettings
  else
    return false

exports.build = (host, tlsCallback) ->
  # Using Chaingang to prevent the forked
  # bash script from creating the same cert at the same time
  # Hacky, but it works
  # TODO: Gen and sign certs using native Node Openssl hooks
  if tlsSettings = getCerts(host)
    tlsCallback(tlsSettings)
  else
    console.log("Queuing up cert gen")
    callback = (err)->
      tlsCallback(getCerts(host))
    job = (host)->
      (worker) ->
        generateCerts host, ->
          worker.finish()
    chain.add job(host), host, callback
