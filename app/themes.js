'use strict';

const TAG = 'oyster/themes';

const handlebars = require('handlebars'),
      extend = require('extend'),
      shuffle = require('lodash').shuffle,
      marked = require('marked'),
      Log = require('huggare'),
      path = require('path'),
      fs = require('fs'),
      //I18n = require('i18n-2'),
      config = require('./config');

function registerPartialDir(hbs, p, prefix) {
  let fns;

  try {
    fns = fs.readdirSync(p);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
    return;
  }

  for (const fn of fns) {
    if (!fn.endsWith('.hbs')) {
      continue;
    }

    const name = path.basename(fn, '.hbs');
    const template = fs.readFileSync(path.resolve(p, fn), 'utf8');

    hbs.registerPartial(prefix ? prefix + name : name, hbs.compile(template));
  }
}

function compileTemplate(hbs, tmplPath) {
  const template = fs.readFileSync(tmplPath, 'utf8');

  return hbs.compile(template);
}

function registerTranslations(ctx, fpath) {
  ctx.locales = {};

  let fns;
  try {
    fns = fs.readdirSync(fpath);
  } catch(err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
    return;
  }

  for (let fn of fns) {
    const data = fs.readFileSync(path.join(fpath, fn));
    const basename = path.basename(fn, '.js');
    const json = JSON.parse(data);
    ctx.locales[basename] = json;
  }
}

const themeHelpers = {
  asset(assetPath, options) {
    return handlebars.Utils.escapeExpression(path.join(
        config.themeAssetsURL, options.data.theme.name, assetPath));
  },

  __() {
    const args = [].slice.call(arguments);
    const options = args.pop();
    const i18n = options.data.ctx.i18n;

    return i18n.__.apply(i18n, args);
  },

  __n() {
    const args = [].slice.call(arguments);
    const options = args.pop();
    const i18n = options.data.ctx.i18n;

    return i18n.__n.apply(i18n, args);
  },

  candidate(candidateName, id, method, options) {
    const partials = options.data.theme.hbs.partials;
    const name = handlebars.Utils.escapeExpression(`elections.${id}.${candidateName}`);

    let classes = 'oyster-candidate-input';

    if (options.hash.class) {
      classes += ` ${handlebars.Utils.escapeExpression(options.hash.class)}`;
    }

    const context = {
      id: name,
      name: candidateName,
      classes
    };

    // TODO implement context options for these properties
    context.minScore = 0;
    context.maxScore = 9;

    const partial = partials[`method/${method}`];

    if (!partial) {
      throw new TypeError(`Unsupported method by theme: ${method}`);
    }

    return new handlebars.SafeString(partial(context, options));
  },

  shuffle(list, options) {
    return handlebars.helpers.each.call(this, shuffle(list), options);
  },

  eachRelevant() {
    // TODO:fix stub
    return handlebars.helpers.each.apply(this, arguments);
  },

  markdown(context, options) {
    return new handlebars.SafeString(marked(context, options.hash));
  },

  json(obj, options) {
    const indent = options.hash.indent || 2;

    return JSON.stringify(obj, null, indent);
  },

  // TODO: this is a hack for a PPAU theme. We'll remove this one day.
  gvtHack(ctx, options) { // eslint-disable-line
    return JSON.stringify(ctx.sections[0].fields[0].candidates, null, 2);
  }
};

class Theme {
  constructor(name, themePath) {
    this.name = name;
    this.path = path.join(themePath, name);

    this.hbs = handlebars.create();
    //this.i18n = new I18n({
    //    // TODO get all the locales from the locales directory.
    //});

    try {
      fs.stat(this.path);
    } catch (err) {
      throw new Error(`No theme found at path: '${this.path}.`);
    }

    // Halpers!
    for (const helper in themeHelpers) {
      this.hbs.registerHelper(helper, themeHelpers[helper]);
    }

    /*
    for (const tmplName of this.basePartials) {
      registerPartial(this.hbs, path.join(this.path, tmplName + '.hbs'));
    }
    */

    // The base of the theme.
    this.index = compileTemplate(this.hbs, path.join(this.path, 'index.hbs'));

    // Extra partials might be needed, add them.
    registerPartialDir(this.hbs, path.join(this.path, 'partials'));

    // Method partials
    registerPartialDir(this.hbs, path.join(this.path, 'partials', 'methods'), 'method/');

    // Register localisations
    registerTranslations(this, path.join(this.path, 'locales'));
  }

  get assetPath() {
    return path.join(this.path, 'assets');
  }

  render() {
    return this.index.apply(this, arguments);
  }
}

class ThemeManager {
  constructor(themePath) {
    this.cache = {};
    this.path = themePath;
  }

  load(themeName) {
    return new Theme(themeName, this.path);
  }

  get(themeName) {
    if (this.cache[themeName]) {
      return this.cache[themeName];
    }

    // if development mode
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      return this.load(themeName);
    } else {
      return (this.cache[themeName] = this.load(themeName));
    }
  }
}

module.exports = function themes(modOpts) {
  const opts = modOpts || {};

  if (!opts.path) {
    throw new TypeError('Missing opts.path.');
  }

  const themeMgr = new ThemeManager(opts.path);

  return function* appThemes(next) {
    this.renderTheme = function* renderTheme(themeName, locals, options) {
      Log.d(TAG, themeName, this);

      const l = extend(true, {}, this.state, locals);
      const o = extend(true, { data: {} }, options);

      o.data.ctx = this;

      const theme = themeMgr.get(themeName);

      o.data.theme = theme;

      this.type = 'html';
      return (this.body = theme.render(l, o));
    };

    yield next;
  };
};
