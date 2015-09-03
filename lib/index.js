'use strict';

var Hoek = require('hoek');
var Joi = require('joi');


var internals = {
    defaults: {
        redirectHttpToHttps: true,
        remoteAddressToClientIp: true,
        remotePortToClientPort: true
    },
    options: Joi.object ({
        redirectHttpToHttps: Joi.boolean(),
        remoteAddressToClientIp: Joi.boolean(),
        remotePortToClientPort: Joi.boolean()
    })
};


exports.register = function (server, options, next) {

    var validateOptions = internals.options.validate(options);
    if(validateOptions.error) {

        return next(validateOptions.error);
    }

    var settings = Hoek.clone(internals.defaults);
    Hoek.merge(settings, options);

    if(!settings.remoteAddressToClientIp
        && !settings.remotePortToClientPort
        && !settings.redirectHttpToHttps) {

        // Plugin has nothing to do so immediately
        // continue.

        return next('Plugin has nothing to do. Please unregister it.');
    }

    server.ext('onRequest', function (request, reply) {

        // The heroku platform automatically routes requests sent to your application
        // to your dynos. Inbound requests are received by a load balancer and then routed
        // to your web dynos. The web dyno receives the request from the router so the
        // originating client ip/port are passed to your web dyno as the
        // 'x-forwarded-for' and 'x-forwarded-port '
        // See: https://devcenter.heroku.com/articles/http-routing#heroku-headers

        if(settings.remoteAddressToClientIp) {

            request.info.remoteAddress = request.headers['x-forwarded-for'] || request.info.remoteAddress;
        }

        if(settings.remotePortToClientPort) {

            request.info.remotePort = request.headers['x-forwarded-port'] || request.info.remotePort;
        }

        // Heroku terminates ssl at the edge of the network so your hapi site will
        // always be running with a http binding in it's dyno. If you wanted the external
        // facing site to be https then it's necessary to redirect to https. The
        // x-forwarded-proto header is set by heroku to specify the originating protocol
        // of the http request
        // See: https://devcenter.heroku.com/articles/http-routing#heroku-headers

        if(settings.redirectHttpToHttps
            && request.method === 'get'
            && request.headers['x-forwarded-proto'] === 'http') {

            return reply()
                .redirect('https://' + request.headers.host + request.url.path)
                .permanent();
        }

        return reply.continue();
    });

    return next();
};

exports.register.attributes = {
    pkg: require('../package.json')
};
