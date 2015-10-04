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

const TAG = 'oyster';

var process = require('process'),
    Log = require('huggare').defaults(),
    mongoose = require('mongoose'),
    co = require('co');

if (process.env.NODE_ENV == null ||
    process.env.NODE_ENV === 'development') {
  Log.setLevel(0);
  Log.d(TAG, 'Development mode: setting log level to VERBOSE');
}

Log.i(TAG, 'Loading config: ' + process.env.PWD + '/config.json');

var config = require('./app/config'),
    models = require('./app/models'),
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
var db = mongoose.connection;

db.on('error', function(err) {
  Log.e(TAG, 'mongodb connection error:', err);
});

db.on('disconnected', function(e) {
  Log.e(TAG, 'mongodb disconnected.', e);
});

db.on('reconnected', function() {
  Log.w(TAG, 'mongodb reconnected.');
});

let app = createApp(__dirname, config);

// Post-routing
process.on('unhandledRejection', function(reason, p) {
  Log.e(TAG, 'Unhandled Rejection at: Promise ', p, ' reason: ', reason);
});

db.once('open', function() {
  Log.i(TAG, 'db connected.');
  co(function*() {
    Log.i(TAG, 'starting results scheduler.');
    yield models.Poll.startScheduler();
  }).then(function() {
    app.listen(config.port);
    Log.i(TAG, 'listening on port ' + config.port);
  });
});
