'use strict';

var createApp = require('../src/app'),
    mongoose = require('mongoose'),
    path = require('path');

var expect = require('chai').expect;

var webdriverio = require('webdriverio');
var client = webdriverio.remote({
  user: process.env.SAUCE_USERNAME,
  key: process.env.SAUCE_ACCESS_KEY
});

var testConfig = {
  production: false,
  host: 'localhost',
  port: 30000,

  mongoHost: 'localhost',
  mongoPort: 27017,
  mongoDB: 'oysterTest',
  mongoUsername: null,
  mongoPassword: null,

  locales: ['en'],

  mailerTransport: function(x) { //eslint-disable-line
    return {
      send: function(x, cb){ cb() } //eslint-disable-line
    };
  },
  mailerConfig: {},

  logPath: null,

  cookieSecret: 'test secret',
  cookieName: 'oyster.id',
  cookieMaxAge: 900000,

  get mongoURL() {
    return 'mongodb://' + this.mongoHost + ':' + this.mongoPort + '/' + this.mongoDB;
  },

  createMailer: function() {
    return; // Stubbed
  }
};

describe('Oyster', function() {
  this.timeout(10000);

  let app, db, agent;

  before(function(done) {
    this.timeout(30000);

    app = createApp(path.resolve(__dirname, '..'), testConfig);

    mongoose.connect(testConfig.mongoURL);
    db = mongoose.connection;

    db.on('error', function(err) {
      console.error(err.toString()); //eslint-disable-line
      process.exit(1);
    });

    db.once('open', function() {
      agent = app.listen(testConfig.port);

      client
        .init()
        .then(function() {
          done();
        });
    });
  });

  describe('Admin page', function() {
    it('should require logging in', function(done) {
      client
        .url('http://this.local:30000/admin')
        .getTitle().then(function(title) {
          expect(title).to.equal('Log in| Oyster');
        })
        .end(done);
    });
  });
});
