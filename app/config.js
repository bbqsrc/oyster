/*!
 * Oyster, a free voting system.
 * Copyright © 2015  Brendan Molloy <brendan@bbqsrc.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * <one line to give the program's name and a brief idea of what it does.>
 */
'use strict';
/* eslint-disable no-process-env */

// TODO: ENV settings etc

const mailer = require('./mailer'),
      crypto = require('crypto'),
      _ = require('lodash'),
      transports = {
        // sendmail: require('nodemailer-sendmail-transport'),
        ses: require('nodemailer-ses-transport')
      };

let baseConfig;

try {
  baseConfig = require(`${process.env.PWD}/config.json`);
} catch (e) {
  if (e.code !== 'MODULE_NOT_FOUND') {
    throw e;
  }
  baseConfig = {};
}

const config = _.defaults({}, baseConfig, {
  production: false,
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
    return mailer.createTransport(config.mailerTransport(config.mailerConfig));
  }
});

if (baseConfig.mailerTransport) {
  config.mailerTransport = transports[baseConfig.mailerTransport];

  if (config.mailerTransport == null) {
    throw new Error(`invalid mailerTransport defined: '${baseConfig.mailerTransport }'`);
  }
}

module.exports = Object.freeze(config);
