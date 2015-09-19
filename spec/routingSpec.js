'use strict';

var createApp = require('../src/app'),
    path = require('path'),
    mongoose = require('mongoose');

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

describe('Environment configuration', function() {
  let app, db;

  beforeAll(function(done) {
    app = createApp(path.resolve(__dirname, '..'), testConfig);

    mongoose.connect(testConfig.mongoURL);
    db = mongoose.connection;

    db.on('error', function(err) {
      console.error(err.toString()); //eslint-disable-line
      process.exit(1);
    });

    db.once('open', function() {
      done();
    });
  });

  afterAll(function() {
    mongoose.disconnect();
  });
});
