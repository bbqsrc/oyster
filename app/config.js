'use strict';
/* eslint-disable no-process-env */

const mailer = require('./mailer'),
      crypto = require('crypto'),
      _ = require('lodash'),
      transports = {
        sendmail: require('nodemailer-sendmail-transport'),
        ses: require('nodemailer-ses-transport')
      };

const template = Object.freeze({
  development: process.env.NODE_ENV === 'development' ||
               process.env.NODE_ENV == null,
  host: 'localhost',
  port: 3000,

  mongoHost: 'localhost',
  mongoPort: 27017,
  mongoDB: 'oyster',
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

  cookieSecret: crypto.randomBytes(64).toString(),
  cookieName: 'oyster.id',
  cookieMaxAge: 900000,

  get mongoURL() {
    return `mongodb://${this.mongoHost}:${this.mongoPort}/${this.mongoDB}`;
  },

  createMailer: function createMailer() {
    return mailer.createTransport(this.mailerTransport(this.mailerConfig));
  }
});

function makeConfig(baseConfig) {
  const config = _.defaults({}, baseConfig, template);

  if (baseConfig.mailerTransport) {
    config.mailerTransport = transports[baseConfig.mailerTransport];

    if (config.mailerTransport == null) {
      throw new Error(`invalid mailerTransport defined: '${baseConfig.mailerTransport }'`);
    }
  }

  return config;
}

module.exports = makeConfig;
