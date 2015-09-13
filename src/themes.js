'use strict';

const TAG = "oyster/themes";

var handlebars = require('handlebars'),
    extend = require('extend'),
    shuffle = require('lodash').shuffle,
    marked = require('marked'),
    Log = require('huggare'),
    path = require('path'),
    fs = require('fs'),
    config = require('./config'),
    util = require('./util');

function registerPartialDir(hbs, p, prefix) {
  let fns;

  try {
    fns = fs.readdirSync(p);
  } catch(err) {
    if (err.code !== "ENOENT") {
      throw err;
    }
    return;
  }

  for (let fn of fns) {
    if (!fn.endsWith('.hbs')) {
      continue;
    }

    let name = path.basename(fn, '.hbs');
    let template = fs.readFileSync(path.resolve(p, fn), 'utf8');
    hbs.registerPartial(prefix ? prefix + name : name, hbs.compile(template));
  }
}

function registerPartial(hbs, partialPath) {
  let template = fs.readFileSync(partialPath, 'utf8');
  let name = path.basename(partialPath, '.hbs');
  return hbs.registerPartial(name, hbs.compile(template));
}

function compileTemplate(hbs, tmplPath, fallbackPath) {
  let template = fs.readFileSync(tmplPath, 'utf8');
  return hbs.compile(template);
}

var themeHelpers = {
  asset: function(assetPath, options) {
    return handlebars.Utils.escapeExpression(path.join(
        config.themeAssetsURL, options.data.theme.name, assetPath));
  },

  __: function() {
    let args = [].slice.call(arguments);
    let options = args.pop();
    let i18n = options.data.ctx.i18n;

    return i18n.__.apply(i18n, args);
  },

  __n: function() {
    let args = [].slice.call(arguments);
    let options = args.pop();
    let i18n = options.data.ctx.i18n;

    return i18n.__n.apply(i18n, args);
  },

  candidate: function(candidateName, id, method, options) {
    let partials = options.data.theme.hbs.partials;
    let name = handlebars.Utils.escapeExpression("elections." + id + "." + candidateName);

    let classes = 'oyster-candidate-input';
    if (options.hash.class) {
      classes += ' ' + handlebars.Utils.escapeExpression(options.hash.class);
    }

    let context = {
      id: name,
      name: candidateName,
      classes: classes
    };

    // TODO implement context options for these properties
    context.minScore = 0;
    context.maxScore = 9;

    let partial = partials['method/' + method];
    if (!partial) {
      throw new TypeError('Unsupported method by theme: ' + method);
    }

    return new handlebars.SafeString(partial(context, options));
  },

  shuffle: function(list, options) {
    return handlebars.helpers.each.call(this, shuffle(list), options);
  },

  eachRelevant: function() {
    // TODO:fix stub
    return handlebars.helpers.each.apply(this, arguments);
  },

  markdown: function(context, options) {
    return new handlebars.SafeString(marked(context, options.hash));
  },

  json: function(obj, options) {
    var indent = options.hash.indent || 2;
    return JSON.stringify(obj, null, indent);
  },

  // TODO: this is a hack for a PPAU theme. We'll remove this one day.
  gvtHack: function(ctx, options) {
    return JSON.stringify(ctx.sections[0].fields[0].candidates, null, 2);
  }
};

class Theme {
  constructor(name, themePath) {
    this.name = name;
    this.path = path.join(themePath, name);

    this.hbs = handlebars.create();

    try {
      fs.stat(this.path);
    } catch(err) {
      throw new Error("No theme found at path: '" + this.path + "'.");
    }

    // Halpers!
    for (let name in themeHelpers) {
      this.hbs.registerHelper(name, themeHelpers[name]);
    }

    /*
    for (let tmplName of this.basePartials) {
      registerPartial(this.hbs, path.join(this.path, tmplName + '.hbs'));
    }
    */

    // The base of the theme.
    this.index = compileTemplate(this.hbs, path.join(this.path, 'index.hbs'));

    // Extra partials might be needed, add them.
    registerPartialDir(this.hbs, path.join(this.path, 'partials'));

    // Method partials
    registerPartialDir(this.hbs, path.join(this.path, 'partials', 'methods'), 'method/');
  }

  get assetPath() {
    return path.join(this.path, 'assets');
  }

  /*
  get basePartials() {
    return [
      'election',
      'header',
      'motion',
      'section'
    ];
  }
  */

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

    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') { // if development mode
      return this.load(themeName);
    } else {
      return this.cache[themeName] = this.load(themeName);
    }
  }
}

Log.setLevel(0);

module.exports = function(opts) {
  opts = opts || {};

  if (!opts.path) {
    throw new TypeError("Missing opts.path.");
  }

  let themeMgr = new ThemeManager(opts.path);

  return function *(next) {
    this.renderTheme = function *(themeName, locals, options) {
      Log.d(TAG, themeName, this);

      let l = extend(true, {}, this.state, locals);
      let o = extend(true, { data: {} }, options);

      o.data.ctx = this;

      let theme = themeMgr.get(themeName);
      o.data.theme = theme;

      this.type = "html";
      return this.body = theme.render(l, o);
    };

    yield next;
  };
};
