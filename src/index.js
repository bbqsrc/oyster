'use strict';

var TAG = 'oyster';

var process = require('process'),
    path = require('path'),
    app = require('koa')(),
    Log = require('huggare'),
    mongoose = require('mongoose'),
    views = require('koa-views'),
    logger = require('koa-huggare'),
    helmet = require('koa-helmet'),
    session = require('koa-session'),
    passport = require('koa-passport'),
    locale = require('koa-locale'),
    i18n = require('koa-i18n'),
    moment = require('moment'),
    co = require('co');

Log.i(TAG, 'Loading config: ' + process.env.PWD + '/config.json');
var config = require('./config');

var models = require('./models'),
    util = require('./util'),
    loggers = require('./loggers');

// Pre-routing
if (config.logPath) {
  Log.addTransport(loggers.FlatFileFormatter({
    path: config.logPath
  }));
} else {
  Log.w(TAG, 'no logPath specified; logging only to console.');
}

app.name = TAG;
app.keys = [config.cookieSecret];
app.proxy = config.proxy || true;

app.use(logger({
  exclude: /^\/static/
}));

locale(app);

app.use(i18n(app, {
  directory: path.resolve(__dirname, '../locales'),
  locales: config.locales,
  modes: ['query', 'cookie', 'header']
}));
app.use(views(path.resolve(__dirname, '../views'), {
  map: { html: 'jade' },
  default: 'jade'
}));
app.use(helmet.defaults());

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

// Catch all the errors.
app.use(function *(next) {
  try {
    yield next;
  } catch (err) {
    this.status = err.status || 500;
    //this.body = err.message;
    this.body = 'Internal server error. Please contact an administrator.';
    this.app.emit('error', err, this);
    Log.e(TAG, this.body, err);
  }
});

require('./auth');

app.use(session({
    key: config.cookieName,
    maxAge: config.cookieMaxAge
  }, app))
  .use(passport.initialize())
  .use(passport.session());

app.use(function *(next) {
  this.state = {
    moment: moment,
    __: this.i18n.__.bind(this.i18n),
    __n: this.i18n.__n.bind(this.i18n)
  };
  yield next;
});

// Routes
let router = require('./routes/index');
util.routeStatic(router, '/static', path.resolve(__dirname, '../assets/static'));

app
  .use(router.routes())
  .use(require('./routes/secured').routes());

app.on('error', function(err, ctx) {
  Log.e(TAG, 'server error', err);
  if (ctx) {
    Log.e(TAG, 'server ctx:', ctx);
  }
});

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
