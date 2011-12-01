(function() {
  var HttpProxy, connect, http, https, isSecure, log, safeParsePath, url;
  var __slice = Array.prototype.slice, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  http = require("http");
  https = require("https");
  url = require("url");
  connect = require("connect");
  log = require("./logger");
  safeParsePath = function(req) {};
  isSecure = function(req) {
    if (req.client && req.client.pair) {
      return true;
    } else if (req.forceSsl) {
      return true;
    } else {
      return false;
    }
  };
  exports.createProxy = function() {
    var middlewares, proxy;
    middlewares = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    proxy = new HttpProxy(middlewares);
    return proxy;
  };
  exports.HttpProxy = HttpProxy = (function() {
    __extends(HttpProxy, connect.HTTPServer);
    function HttpProxy(middlewares) {
      var _ref;
      this.middlewares = middlewares;
      if ((_ref = this.middlewares) == null) {
        this.middlewares = [];
      }
      HttpProxy.__super__.constructor.call(this, this.bookendedMiddleware());
    }
    HttpProxy.prototype.bookendedMiddleware = function() {
      this.middlewares.unshift(this.proxyCleanup);
      this.middlewares.push(this.outboundProxy);
      return this.middlewares;
    };
    HttpProxy.prototype.proxyCleanup = function(req, res, next) {
      var proxyUrl, safeUrl, serverPort;
      if ((req.realHost != null)) {
        log.debug("Overriding outbound host to:" + req.realHost);
        req._host = req.realHost;
      } else {
        req._host = req.headers['host'].split(":")[0];
      }
      serverPort = req._host.split(":")[1];
      if (serverPort != null) {
        req._port = serverPort;
      } else if (req.ssl) {
        req._port = 443;
      } else {
        req._port = 80;
      }
      if (isSecure(req)) {
        req.fullUrl = "https://" + req.headers['host'] + req.url;
        req.ssl = true;
      } else {
        safeUrl = '';
        proxyUrl = url.parse(req.url.slice(1));
        safeUrl += proxyUrl.pathname;
        if (proxyUrl.search != null) {
          safeUrl += proxyUrl.search;
        }
        req.url = safeUrl;
        req.fullUrl = "http://" + req.headers['host'] + req.url;
      }
      return next();
    };
    HttpProxy.prototype.listenHTTPS = function(port) {
      var httpsProxy;
      httpsProxy = require('./https_proxy');
      return httpsProxy.createProxy(this.middlewares).listen(port);
    };
    HttpProxy.prototype.listen = function(port) {
      HttpProxy.__super__.listen.call(this, port);
      return this;
    };
    HttpProxy.prototype.outboundProxy = function(req, res, next) {
      var passed_opts, upstream_processor, upstream_request;
      passed_opts = {
        method: req.method,
        path: req.url,
        host: req._host,
        headers: req.headers,
        port: req._port
      };
      upstream_processor = function(upstream_res) {
        res.statusCode = upstream_res.statusCode;
        res.headers = upstream_res.headers;
        res.writeHead(upstream_res.statusCode, upstream_res.headers);
        upstream_res.on('data', function(chunk) {
          res.emit('data', chunk);
          return res.write(chunk, 'binary');
        });
        upstream_res.on('end', function(data) {
          res.emit('end', data);
          return res.end(data);
        });
        upstream_res.on('close', function() {
          return res.emit('close');
        });
        return upstream_res.on('error', function() {
          res.emit('end');
          return res.abort();
        });
      };
      req.on('data', function(chunk) {
        return upstream_request.write(chunk);
      });
      req.on('error', function(error) {
        return log.error("ERROR: " + error);
      });
      if (req.ssl) {
        upstream_request = https.request(passed_opts, upstream_processor);
      } else {
        upstream_request = http.request(passed_opts, upstream_processor);
      }
      upstream_request.on('error', function(err) {
        log.error("Fail - " + req.method + " - " + req.fullUrl);
        return res.end();
      });
      return upstream_request.end();
    };
    return HttpProxy;
  })();
}).call(this);
