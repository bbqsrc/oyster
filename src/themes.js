'use strict';

var TAG = "oyster/themes";

var handlebars = require('handlebars'),
    extend = require('extend'),
    shuffle = require('lodash').shuffle,
    marked = require('marked'),
    Log = require('huggare'),
    path = require('path'),
    fs = require('fs'),
    config = require('./config'),
    util = require('./util');

function registerPartialDir(hbs, p) {
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
    let template = fs.readFileSync(fn, 'utf8');
    let name = path.basename(fn, '.hbs');
    hbs.registerPartial(name, template);
  }
}

function registerPartial(hbs, partialPath) {
  let template = fs.readFileSync(partialPath, 'utf8');
  let name = path.basename(partialPath, '.hbs');
  return hbs.registerPartial(name, template);
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

  candidate: function(method, id, options) {
    let name = handlebars.Utils.escapeExpression("elections." + id + "." + this);

    let classes = 'oyster-candidate-input';
    if (options.hash.class) {
      classes += ' ' + handlebars.Utils.escapeExpression(options.hash.class);
    }

    // TODO implement
    let minScore = 0; //handlebars.Utils.escapeExpression(this.minScore);
    let maxScore = 9; //handlebars.Utils.escapeExpression(this.maxScore);

    let inputNode;

    switch (method) {
      case "schulze":
        inputNode = "<input name='" + name + "' class='" + classes + "' type='number' step='1' min='1'>";
        break;
      case "score":
        inputNode = "<input name='" + name + "' class='" + classes + "' type='number' step='1' min='" + minScore + "' max='" + maxScore + "'>";
        break;
      case "approval":
        inputNode = "<input name='" + name + "' class='" + classes + "' type='checkbox' value='1'>";
        break;
      default:
        throw new TypeError('invalid method: ' + method);
    }

    return new handlebars.SafeString(inputNode);
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

    for (let tmplName of this.basePartials) {
      registerPartial(this.hbs, path.join(this.path, tmplName + '.hbs'));
    }

    // Extra partials might be needed, add them.
    registerPartialDir(this.hbs, path.join(this.path, 'partials'));

    // The base of the theme.
    this.index = compileTemplate(this.hbs, path.join(this.path, 'index.hbs'));
  }

  get assetPath() {
    return path.join(this.path, 'assets');
  }

  get basePartials() {
    return [
      'election',
      'header',
      'motion',
      'section'
    ];
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

  let middleware = function *(next) {
    this.renderTheme = function *(themeName, locals, options) {
      Log.d(TAG, themeName);
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

  return middleware;
};
