'use strict';

// TODO: ENV settings etc

var baseConfig,
    mailer = require('./mailer'),
    crypto = require('crypto'),
    _ = require('lodash'),
    transports = {
      //sendmail: require('nodemailer-sendmail-transport'),
      ses: require('nodemailer-ses-transport')
    },
    Log = require('huggare');

var TAG = 'oyster/config';

try {
  baseConfig = require(process.env.PWD + '/config.json');
} catch(e) {
  if (e.code !== 'MODULE_NOT_FOUND') {
    throw e;
  }
  baseConfig = {};
}

var config = _.defaults({}, baseConfig, {
  production: false,
  host: 'localhost',
  port: 3000,

  mongoHost: 'localhost',
  mongoPort: 27017,
  mongoDB: 'oyster',
  mongoUsername: null,
  mongoPassword: null,

  mailerTransport: function(x) { //eslint-disable-line
    return {
      send: function(x, cb){ cb() } //eslint-disable-line
    };
  },
  mailerConfig: {},

  logPath: null,

  cookieSecret: crypto.randomBytes(64).toString(),
  cookieName: 'oyster.id',
  cookieMaxAge: 900000,

  get mongoURL() {
    return 'mongodb://' + this.mongoHost + ':' + this.mongoPort + '/' + this.mongoDB;
  },

  createMailer: function() {
    return mailer.createTransport(config.mailerTransport(config.mailerConfig));
  }
});

if (baseConfig.mailerTransport) {
  config.mailerTransport = transports[baseConfig.mailerTransport];

  if (config.mailerTransport == null) {
    throw new Error("invalid mailerTransport defined: '" + baseConfig.mailerTransport + "'");
  }
}

module.exports = Object.freeze(config);
