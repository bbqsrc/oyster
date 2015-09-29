'use strict';

const TAG = 'oyster';

const process = require('process'),
      Log = require('huggare').defaults(),
      mongoose = require('mongoose'),
      path = require('path'),
      co = require('co');

const configPath = path.join(__dirname, 'config.json');

Log.i(TAG, `Loading config: ${configPath}`);
const config = require('./app/config')(require(configPath));

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
