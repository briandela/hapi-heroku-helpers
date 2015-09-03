# Hapi Heroku Helpers #

[![Build Status](https://travis-ci.org/briandela/hapi-heroku-helpers.svg?branch=master)](https://travis-ci.org/briandela/hapi-heroku-helpers) [![Coverage Status](https://img.shields.io/coveralls/briandela/hapi-heroku-helpers.svg)](https://coveralls.io/r/briandela/hapi-heroku-helpers) [![Dependencies Up To Date](https://david-dm.org/briandela/hapi-heroku-helpers.svg?style=flat)](https://david-dm.org/briandela/hapi-heroku-helpers)

hapi.js plugin which provides some basic functionality which can be useful when running a hapi.js site on Heroku.

### Heroku ###
The Heroku platform automatically routes HTTP requests sent to your app’s hostname(s) to your web dynos. Inbound requests are received by a load balancer that offers SSL termination. From there they are passed directly to a set of routers which routes the request to your application. Think of it as a reverse proxy.


#### HTTPS ####
If you want your site to have `https` urls, that SSL termination happens on the edge of the heroku network, and the request is routed to your application using `http`. By default this plugin allows you to have any `http` request redirected automatically to a `https` request (see `redirectHttpToHttps` setting)

#### Client IP Address ####
Your hapi site will see the incoming HTTP request as coming from the IP address of the Heroku router and set this IP to request.info.remotePort. In the majority of cases you most likely are interested in the originating IP address and not the routers address. By default this plugin sets `request.info.remoteAddress` to the value of the `x-forwarded-for` header which Heroku sets to the originating IP address (see `remoteAddressToClientIp` setting)

#### Client Port ####
Your hapi site will see the incoming HTTP request as coming from the PORT that hapi is running on inside the Heroku platform (which is rarely the port your site is running on - i.e. 80 or 443). In the majority of cases you most likely are interested in the port that the client is connecting on. By default this plugin sets `request.info.remotePort` to the value of the `x-forwarded-port` header which Heroku sets to the originating port (see `remotePortToClientPort` setting)


### Options

The following options are available:

* `redirectHttpToHttps`: if `true` **and** the `x-forwarded-proto` header equals `http`, will result in the request being redirected via a `301` to the `https://` version of the URL. Heroku sets the `x-forwarded-proto` header to the originating protocol of the HTTP request (example: http). For example, `http://localhost:3000/some-url` would redirect to `https://localhost:3000/some-url`. Defaults to `true`.

* `remoteAddressToClientIp`: if `true`, will set `request.info.remoteAddress` to the value of the `x-forwarded-for` header if it exists and is non-empty. Heroku set the `x-forwarded-for` header to the originating IP address of the client connecting to the Heroku router. Defaults to `true`.

* `remotePortToClientPort`: if `true`, will set `request.info.remoteAddress` to the value of the `x-forwarded-port` header if it exists and is non-empty. Heroku set the `x-forwarded-port` header to the originating port of the HTTP request (example: 443). Defaults to `true`.


### Usage

``` javascript
var Hapi = require('hapi');

var server = new Hapi.Server();
server.connection();

server.register(require('hapi-heroku-helpers'), function (err) {

    // Assuming no err, start server

    server.start(function () {
        // ..
    });
});
```
