'use strict';

const TAG = 'oyster';

const koa = require('koa'),
      Log = require('huggare'),
      resolvePath = require('resolve-path'),
      views = require('koa-views'),
      logger = require('koa-huggare'),
      helmet = require('koa-helmet'),
      session = require('koa-session'),
      passport = require('koa-passport'),
      passportMongo = require('passport-mongodb'),
      koaLocale = require('koa-locale'),
      i18n = require('koa-i18n'),
      send = require('koa-send'),
      compress = require('koa-compress'),
      moment = require('moment');

const MONTH = 2629740;

function routeStatic(router, prefix, root) {
  router.get(`${prefix}/:staticPath(.+)`, function* sendStatic() {
    yield send(this, this.params.staticPath, {
      root,
      maxage: MONTH
    });
  });
}

function routeThemes(router, prefix, root) {
  router.get(`${prefix}/:theme([-_A-Za-z0-9]+?)/:staticPath([^\\.].+)`,
  function* sendThemeStatic() {
    yield send(this, this.params.staticPath, {
      root: resolvePath(root, this.params.theme, 'assets')
    });
  });
}

module.exports = function createApp(root, config) {
  const app = koa();

  app.name = TAG;
  app.keys = [config.cookieSecret];
  app.proxy = config.proxy || true;

  app.use(logger({
    exclude: /^\/static/
  }));

  app.use(compress());

  koaLocale(app);

  app.use(i18n(app, {
    directory: resolvePath(root, 'content/locales'),
    locales: config.locales,
    modes: ['query', 'cookie', 'header']
  }));

  app.use(views('./views', {
    map: { html: 'jade' },
    default: 'jade'
  }));

  app.use(helmet());

  // Catch all the errors.
  app.use(function* errorCatcher(next) {
    try {
      yield next;
    } catch (err) {
      this.status = err.status || 500;
      const msg = 'Internal server error. Please contact an administrator.';

      if (config.development) {
        this.body = `<pre>${err.stack}</pre>`;
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

  app.use(function* setAppState(next) {
    let locale = config.locales[0];
    let user;

    if (this.req.user) {
      user = this.req.user;
    }

    if (user && user.data.locale) {
      locale = user.data.locale;
      this.i18n.setLocale(locale);
    }

    this.state = {
      moment,
      __: this.i18n.__.bind(this.i18n),
      __n: this.i18n.__n.bind(this.i18n),
      user,
      locale
    };

    yield next;
  });

  // Delicious themes.
  app.use(require('./themes')({
    path: resolvePath(root, 'content/themes')
  }));

  // Routes
  const router = require('./routes/index');

  routeStatic(router, '/static', resolvePath(root, 'assets/static'));
  routeThemes(router, '/themes', resolvePath(root, 'content/themes'));

  app
    .use(router.routes())
    .use(require('./routes/secured').routes())
    .use(require('./routes/api').routes());

  app.on('error', (err, ctx) => {
    Log.e(TAG, 'server error', err);
    if (ctx) {
      Log.e(TAG, 'server ctx:', ctx);
    }
  });

  return app;
};
