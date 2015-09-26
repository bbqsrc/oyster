'use strict';

const TAG = 'oyster';

var koa = require('koa'),
    Log = require('huggare'),
    resolvePath = require('resolve-path'),
    views = require('koa-views'),
    logger = require('koa-huggare'),
    helmet = require('koa-helmet'),
    session = require('koa-session'),
    passport = require('koa-passport'),
    passportMongo = require('passport-mongodb'),
    locale = require('koa-locale'),
    i18n = require('koa-i18n'),
    send = require('koa-send'),
    moment = require('moment');

function routeStatic(router, prefix, root) {
  router.get(prefix + '/:staticPath(.+)', function *() {
    yield send(this, this.params.staticPath, {
      root: root
    });
  });
}

function routeThemes(router, prefix, root) {
  router.get(prefix + '/:theme([-_A-Za-z0-9]+?)/:staticPath([^\\.].+)', function *() {
    yield send(this, this.params.staticPath, {
      root: resolvePath(root, this.params.theme, 'assets')
    });
  });
}

module.exports = function createApp(root, config) {
  let app = koa();

  app.name = TAG;
  app.keys = [config.cookieSecret];
  app.proxy = config.proxy || true;

  app.use(logger({
    exclude: /^\/static/
  }));

  locale(app);

  app.use(i18n(app, {
    directory: resolvePath(root, 'content/locales'),
    locales: config.locales,
    modes: ['query', 'cookie', 'header']
  }));

  app.use(views('./views', {
    map: { html: 'jade' },
    default: 'jade'
  }));

  app.use(helmet.defaults());

  // Catch all the errors.
  app.use(function *(next) {
    try {
      yield next;
    } catch (err) {
      this.status = err.status || 500;
      let msg = 'Internal server error. Please contact an administrator.';

      if (process.env.NODE_ENV == null ||
          process.env.NODE_ENV === 'development') {
        this.body = '<pre>'+ err.stack + '</pre>';
      } else {
        this.body = msg;
      }
      this.app.emit('error', err, this);
      Log.e(TAG, err);
    }
  });

  passportMongo.setup(passport);

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
      __n: this.i18n.__n.bind(this.i18n),
      user: this.req.user
    };

    yield next;
  });

  // Delicious themes.
  app.use(require('./themes')({
    path: resolvePath(root, 'content/themes')
  }));

  // Routes
  let router = require('./routes/index');
  routeStatic(router, '/static', resolvePath(root, 'assets/static'));
  routeThemes(router, '/themes', resolvePath(root, 'content/themes'));

  app
    .use(router.routes())
    .use(require('./routes/secured').routes())
    .use(require('./routes/api').routes());

  app.on('error', function(err, ctx) {
    Log.e(TAG, 'server error', err);
    if (ctx) {
      Log.e(TAG, 'server ctx:', ctx);
    }
  });

  return app;
};
