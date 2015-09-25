'use strict';

const TAG = 'oyster';

var process = require('process'),
    Log = require('huggare').defaults(),
    mongoose = require('mongoose'),
    path = require('path'),
    co = require('co');

Log.i(TAG, 'Loading config: ' + process.env.PWD + '/config.json');

var config = require('./src/config'),
    models = require('./src/models'),
    loggers = require('./src/loggers'),
    createApp = require('./src/app');

// Pre-routing
if (config.logPath) {
  /*
  Log.addTransport(loggers.FlatFileFormatter({
    path: config.logPath
  }));
  */
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
