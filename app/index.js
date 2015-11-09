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
      send = require('koa-send'),
      compress = require('koa-compress'),
      moment = require('moment'),
      dot = require('dot-object'),
      IntlMessageFormat = require('intl-messageformat'),
      locales = require('./locales');

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
      root: resolvePath(root, `${this.params.theme}/assets`)
    });
  });
}

function setAppState(config) {
  return function* setAppState(next) { // eslint-disable-line
    let locale = config.locales[0];
    let user;

    if (this.req.user) {
      user = this.req.user;
    }

    if (this.getLocaleFromQuery()) {
      locale = this.getLocaleFromQuery();
    } else if (user && user.data.locale) {
      locale = user.data.locale;
    }

    this.state = {
      moment,
      translate: this.translate.bind(this),
      user,
      locale
    };

    yield next;
  };
}


function translate(config) {
  const translateCache = {};

  return function* translateMiddleware(next) {
    this.translate = function translate(key, opts) { // eslint-disable-line
      const k = `${this.state.locale}:${key}`;
      let tmpl;

      if (translateCache[k]) {
        tmpl = translateCache[k];
      } else {
        const msg = dot.pick(key, this.intl.get(this.state.locale));

        tmpl = new IntlMessageFormat(msg, this.state.locale);

        if (config.production) {
          translateCache[k] = tmpl;
        }
      }

      return tmpl.format(opts || {});
    };

    yield next;
  };
}


function errorCatcher(config) {
  return function* errorCatcher(next) { // eslint-disable-line
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
  };
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

  app.use(locales({
    path: resolvePath(root, 'content/locales')
  }));

  app.use(translate(config));

  app.use(views('./views', {
    map: { html: 'jade' },
    default: 'jade'
  }));

  app.use(helmet());

  // Catch all the errors.
  app.use(errorCatcher(config));

  passportMongo.setup(passport);

  app.use(session({
    key: config.cookieName,
    maxAge: config.cookieMaxAge
  }, app))
  .use(passport.initialize())
  .use(passport.session());

  app.use(setAppState(config));

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
