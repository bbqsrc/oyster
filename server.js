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
'use strict'; /* global Intl */

const TAG = 'oyster';

const process = require('process'),
      Log = require('huggare').defaults(),
      mongoose = require('mongoose'),
      path = require('path'),
      co = require('co');

// Adds missing locales
const IntlPolyfill = require('intl');

Intl.NumberFormat = IntlPolyfill.NumberFormat;
Intl.DateTimeFormat = IntlPolyfill.DateTimeFormat;

const provider = require('./app/provider');

const configPath = path.join(__dirname, 'config.json');

Log.i(TAG, `Loading config: ${configPath}`);
const config = require('./app/config')(require(configPath));

provider.config = config;

if (config.development) {
  Log.setLevel(Log.VERBOSE);
  Log.d(TAG, 'Development mode: setting log level to VERBOSE');
}

const models = require('./app/models'),
      loggers = require('./app/loggers'),
      createApp = require('./app');

// Pre-routing
if (config.logPath) {
  Log.addTransport(loggers.FlatFileFormatter({
    path: config.logPath
  }));
} else {
  Log.w(TAG, 'no logPath specified; logging only to console.');
}

Log.i(TAG, 'Connecting to mongodb...');
mongoose.connect(config.mongoURL);
const db = mongoose.connection;

db.on('error', err => {
  Log.e(TAG, 'mongodb connection error:', err);
});

db.on('disconnected', e => {
  Log.e(TAG, 'mongodb disconnected.', e);
});

db.on('reconnected', () => {
  Log.w(TAG, 'mongodb reconnected.');
});

const app = createApp(__dirname, config);

// Post-routing
process.on('unhandledRejection', (reason, p) => {
  Log.e(TAG, `Unhandled Rejection at: Promise ${p}, reason: ${reason}`);
});

db.once('open', () => {
  co(function* onOpen() {
    Log.i(TAG, 'db connected.');
    Log.i(TAG, 'starting results scheduler.');
    yield models.Poll.startScheduler();

    app.listen(config.port);
    Log.i(TAG, `listening on port ${config.port}`);
  });
});
