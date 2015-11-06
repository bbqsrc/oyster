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

const mailer = require('./mailer'),
      crypto = require('crypto'),
      _ = require('lodash');

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
    config.mailerTransport = require(`nodemailer-${baseConfig.mailerTransport}-transport`);
  }

  return config;
}

module.exports = makeConfig;
