'use strict';

const Lab = require('lab');
const Hapi = require('hapi');
const Code = require('code');

const lab = exports.lab = Lab.script();
const expect = Code.expect;
const describe = lab.describe;
const it = lab.it;
const before = lab.before;


describe('Plugin registration', function () {

    it('successfully registers without requiring options', function (done) {

        const server = new Hapi.Server();
        server.connection();

        server.register(require('..'), function (err) {

            expect(err).to.not.exist();

            expect(server.registrations['hapi-heroku-helpers']).to.exist();
            expect(server.registrations['hapi-heroku-helpers'].version).to.equal(require('../package.json').version);

            done();
        });
    });

    it('asserts if there are invalid options', function (done) {

        const server = new Hapi.Server();
        server.connection();

        const plugin = {
            register: require('..'),
            options: 'weird options'
        };

        server.register(plugin, function (err) {

            expect(err).to.exist();

            done();
        });
    });

    it('asserts if there is nothing for the plugin to do', function (done) {

        const server = new Hapi.Server();
        server.connection();

        const plugin = {
            register: require('..'),
            options: {
                redirectHttpToHttps: false,
                remoteAddressToClientIp: false,
                remotePortToClientPort: false
            }
        };

        server.register(plugin, function (err) {

            expect(err).to.equal('Plugin has nothing to do. Please unregister it.');

            done();
        });
    });
});

describe('redirectHttpToHttps', function () {

    describe('enabled', function () {

        let server;

        before(function (done) {

            server = new Hapi.Server();
            server.connection();

            server.route({
                method: ['GET', 'POST'],
                path: '/',
                handler: function (request, reply) {

                    return reply(true);
                }
            });

            server.route({
                method: ['GET', 'POST'],
                path: '/somepath',
                handler: function (request, reply) {

                    return reply(true);
                }
            });

            server.register(require('..'), done);
        });

        it('redirects to https when x-forwarded-proto is http', function (done) {

            const requestOptions = {
                method: 'GET',
                url: '/',
                headers: {
                    'x-forwarded-proto': 'http'
                }
            };

            server.inject(requestOptions, function (res) {

                expect(res.statusCode).to.equal(301);
                expect(res.headers.location).to.startWith('https://');

                done();
            });
        });

        it('redirects contain path and query string', function (done) {

            const url = '/human?spud=ada';
            const requestOptions = {
                method: 'GET',
                url,
                headers: {
                    'x-forwarded-proto': 'http'
                }
            };

            server.inject(requestOptions, function (res) {

                expect(res.statusCode).to.equal(301);
                expect(res.headers.location).to.startWith('https://');
                expect(res.headers.location).to.endWith(url);

                done();
            });
        });

        it('does not redirect POST requests even then when x-forwarded-proto is http', function (done) {

            const requestOptions = {
                method: 'POST',
                url: '/',
                headers: {
                    'x-forwarded-proto': 'http'
                }
            };

            server.inject(requestOptions, function (res) {

                expect(res.statusCode).to.equal(200);

                done();
            });
        });

        it('does not redirect to https when x-forwarded-proto is not http', function (done) {

            const requestOptions = {
                method: 'GET',
                url: '/',
                headers: {
                    'x-forwarded-proto': 'random'
                }
            };

            server.inject(requestOptions, function (res) {

                expect(res.statusCode).to.equal(200);

                done();
            });
        });

        it('does not redirect to https when x-forwarded-proto is not set', function (done) {

            const requestOptions = {
                method: 'GET',
                url: '/'
            };

            server.inject(requestOptions, function (res) {

                expect(res.statusCode).to.equal(200);

                done();
            });
        });
    });

    describe('disabled', function () {

        let server;

        before(function (done) {

            server = new Hapi.Server();
            server.connection();

            server.route({
                method: 'GET',
                path: '/',
                handler: function (request, reply) {

                    return reply(true);
                }
            });

            const plugin = {
                register: require('..'),
                options: {
                    redirectHttpToHttps: false
                }
            };

            server.register(plugin, done);
        });

        it('does not redirect to https even when x-forwarded-proto is http', function (done) {

            const requestOptions = {
                method: 'GET',
                url: '/',
                headers: {
                    'x-forwarded-proto': 'http'
                }
            };

            server.inject(requestOptions, function (res) {

                expect(res.statusCode).to.equal(200);

                done();
            });
        });
    });
});


describe('remoteAddressToClientIp', function () {

    describe('enabled', function () {

        let server;

        before(function (done) {

            server = new Hapi.Server();
            server.connection();

            server.route({
                method: 'GET',
                path: '/',
                handler: function (request, reply) {

                    return reply(request.info.remoteAddress);
                }
            });

            server.register(require('..'), done);
        });

        it('sets request.info.remoteAddress to the value of x-forwarded-for', function (done) {

            const requestOptions = {
                method: 'GET',
                url: '/',
                headers: {
                    'x-forwarded-for': '192.16.184.0'
                }
            };

            server.inject(requestOptions, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.result).to.equal('192.16.184.0');

                done();
            });
        });

        it('does not change request.info.remoteAddress if there is no x-forwarded-for', function (done) {

            const requestOptions = {
                method: 'GET',
                url: '/'
            };

            server.inject(requestOptions, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.result).to.equal('127.0.0.1');

                done();
            });
        });
    });

    describe('disabled', function () {

        let server;

        before(function (done) {

            server = new Hapi.Server();
            server.connection();

            server.route({
                method: 'GET',
                path: '/',
                handler: function (request, reply) {

                    return reply(request.info.remoteAddress);
                }
            });

            const plugin = {
                register: require('..'),
                options: {
                    remoteAddressToClientIp: false
                }
            };

            server.register(plugin, done);
        });

        it('does not change request.info.remoteAddress even when x-forwarded-for is set', function (done) {

            const requestOptions = {
                method: 'GET',
                url: '/',
                headers: {
                    'x-forwarded-for': '192.16.184.0'
                }
            };

            server.inject(requestOptions, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.result).to.equal('127.0.0.1');

                done();
            });
        });

    });
});


describe('remotePortToClientPort', function () {

    describe('enabled', function () {

        let server;

        before(function (done) {

            server = new Hapi.Server();
            server.connection();

            server.route({
                method: 'GET',
                path: '/',
                handler: function (request, reply) {

                    return reply(request.info.remotePort);
                }
            });

            server.register(require('..'), done);
        });

        it('sets request.info.remotePort to the value of x-forwarded-for', function (done) {

            const requestOptions = {
                method: 'GET',
                url: '/',
                headers: {
                    'x-forwarded-port': '3781'
                }
            };

            server.inject(requestOptions, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.result).to.equal('3781');

                done();
            });
        });

        it('does not change request.info.remotePort if there is no x-forwarded-port', function (done) {

            const requestOptions = {
                method: 'GET',
                url: '/'
            };

            server.inject(requestOptions, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.result).to.be.null();

                done();
            });
        });
    });

    describe('disabled', function () {

        let server;

        before(function (done) {

            server = new Hapi.Server();
            server.connection();

            server.route({
                method: 'GET',
                path: '/',
                handler: function (request, reply) {

                    return reply(request.info.remotePort);
                }
            });

            const plugin = {
                register: require('..'),
                options: {
                    remotePortToClientPort: false
                }
            };

            server.register(plugin, done);
        });

        it('does not change request.info.remotePort even when x-forwarded-port is set', function (done) {

            const requestOptions = {
                method: 'GET',
                url: '/',
                headers: {
                    'x-forwarded-port': '3781'
                }
            };

            server.inject(requestOptions, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.result).to.equal(null);

                done();
            });
        });
    });
});
