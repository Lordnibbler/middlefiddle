# Require coffee-script to allow us to use .coffee proxies
require 'coffee-script'
optimist = require 'optimist'
path = require 'path'
log = require './logger'

# Let us find this in 'top'
process.title = "middlefiddle"

# Print valid command-line arguments and exit with a non-zero exit
usage = ->
  console.error "usage: mf [middleware]"
  process.exit -1
unless process.argv.length > 2
  usage()

passedArgs = optimist.parse(process.argv.slice(3))
Mf = require './index' # Dependency injection for the middleware proxies

# Look for the appropriate 'fiddle'
# First looks locally
# Then in the ./middlefiddle/fiddles directory
# And finally in the modules own list
fiddlePaths = [
  process.cwd()
  Mf.config.mfDir + '/fiddles'
  __dirname + '/fiddles'
]

log.debug("Checking the following locations")
log.debug(fiddlePaths)

activeFiddle = null
for fiddlePath in fiddlePaths
  testPath = fiddlePath + "/" + process.argv[2]
  if path.existsSync(testPath + ".coffee") || path.existsSync(testPath + ".js")
    activeFiddle = testPath
    break
if activeFiddle == null
  log.error("Can't find a fiddle named '#{process.argv[2]}'. Looked in: " + fiddlePaths)
  process.exit -1

# Middleware are passed both the MiddleFiddle object, and any additional arguments
middleware = require(activeFiddle).middleware(Mf, passedArgs)

log.info("Starting HTTP Proxy on port #{Mf.config.httpPort}")
log.info("Starting HTTPS Proxy on port #{Mf.config.httpsPort}")
Mf.createProxy.apply(this, middleware).listen(Mf.config.httpPort).listenHTTPS(Mf.config.httpsPort)
