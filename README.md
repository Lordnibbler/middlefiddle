# MiddleFiddle

MiddleFiddle is an outbound local proxy which lets to modify your outbound request and responses
via [Connect](http://senchalabs.github.com/connect/) middleware. It support HTTP and HTTPS, the
latter through a hijacking of the request with locally generated SSL certs.

## Web Logging

By default MiddleFiddle logs all outbound traffic to a web based logger on localhost:8411

![Request Logger](http://mdp.github.com/middlefiddle/images/RequestLogger.jpg)
![Request Logger](http://mdp.github.com/middlefiddle/images/RequestDetails.jpg)


## Installtion

    npm install -g middlefiddle

## Installation via Github

    # Depends on Node 0.6.x
    git clone git://github.com/mdp/middlefiddle.git
    cd middlefiddle
    npm install
    npm link #If you want to use it globally

## Usage

### Basic usage

By default middlefiddle will start logging traffic and modifying
requests based on site specific middleware found in '.middlefiddle/sites'

You can find an example in 
[.middlefiddle/sites](https://github.com/mdp/middlefiddle/tree/master/.middlefiddle/sites)

    # Start middlefiddle with default options
    middlefiddle
    # Proxy will be at port 8080
    # and the web logger will be open at port 8411

### Using the logger

    middlefiddle logger
    # Now open http://localhost:8411

    # Only log for a certain URL
    middlefiddle logger --url google.com

    # Only log certain statuses
    middlefiddle logger --status 404

    # Only log responses containing text
    middlefiddle logger --grep "setTimeout"
    # Also work with regex
    middlefiddle logger -r --grep "Mark(Percival)?"
    # And case insensitive
    middlefiddle logger -ri --grep "m@mdp\.im"

## Configuration

MiddleFiddle looks for a .middlefiddle directory in the current working directory, or at ~/.middlefiddle.

Inside you'll find a config.coffee file, https certs, and a sites directory.

You'll need to add the https certs to you keychain if you want to avoid
the browser warning. The certs are generated on the first launch of
middlefiddle and are therefor unique to each machine.

### Sites

MiddleFiddle can alter requests based on the host name. You'll find some examples in
[.middlefiddle/sites](https://github.com/mdp/middlefiddle/tree/master/.middlefiddle/sites)

## Building your own Middleware

MiddleFiddle middleware is connect compatible. Anything you can do with
Connect, you can do with middlefiddle middleware.

### Saving any mp3's from a site

For example, lets say you want to save all the streamed mp3's from
Soundcloud.com

*Found in soundcloud.com.cofffee*

    fs = require 'fs'
    module.exports = (Mf) ->
      (req, res, next) ->
        res.on 'body', ->
          if res.headers["content-type"] == 'audio/mpeg'
            fileName = req.path.replace(/^[a-zA-Z]/, '').split('.')[0]
            path = "#{process.env["HOME"]}/Downloads/soundcloud#{fileName}.mp3"
            fs.writeFile path, res.body, ->
              console.log "Saved #{res.body.length} bytes to #{path}"
        next()

### Find and replace any text

In this case we used the MiddleFiddle helper 'replace'

*Found in github.com.cofffee*

    module.exports = (Mf) ->
      replacement = (string, req, res) ->
        contentType = res.headers['content-type'] || ''
        if contentType.search(/html/) >= 0
          string.replace(/repositories/ig, "suppositories")
        else
          false
      return  Mf.replace(replacement)

### Modify outbound request headers

Here we are going to change the user agent to GoogleBot

*Found in ft.com.cofffee*

    module.exports = (Mf) ->
      # I'm the Google, let me in!
      (req, res, next) ->
        req.headers['user-agent'] = "GoogleBot"
        next()


## HTTPS Hijacking

When an HTTPS request is first seen, MiddleFiddle generates a certificate for that domain, signs
it with it's own generated root cert, and stores the cert for future use in
~/.middlefiddle/certs

In order to make this look legit to your browser, you'll need to add the generated
root cert in ~/.middlefiddle/ca.crt to your keychain. This cert is auto generated
just for your machine, so you won't be compromising your browser security.

## Things to note

Connect typically doesn't have a simple way to hijack downstream responses, so
middlefiddle emits events on the response along with writing to the stream.

You've also got a couple helper properties:

- req.fullUrl #=> The full requested URL, including the schema
- req.isSecure #=> Did it come via SSL?

## TODO

- Clean up cert generation
- Expand logging
- Add more middleware

## Want to contribute

Criticism is gladly accepted as long as it's in the form of a pull request.

## Development

MiddleFiddle is written in CoffeeScript. It's set
up with a Cakefile for building files in `src/` to `lib/` and running
tests with nodeunit. There's also a `docs` task that generates Docco
documentation from the source in `src/`.

Released under the MIT license.

Mark Percival <m@mdp.im>
