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
 */
'use strict';

const handlebars = require('handlebars'),
      HandlebarsIntl = require('handlebars-intl'),
      extend = require('extend'),
      shuffle = require('lodash').shuffle,
      marked = require('marked'),
      path = require('path'),
      fs = require('fs'),
      config = require('./provider').config;

HandlebarsIntl.registerWith(handlebars);

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
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
    return;
  }

  for (const fn of fns) {
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

  candidate(ctx, id, method, options) {
    let candidateName;
    let candidateInfo;

    if (typeof ctx === 'string') {
      candidateName = ctx;
    } else {
      candidateName = ctx.name;
      candidateInfo = ctx.info;
    }

    const partials = options.data.theme.hbs.partials;
    const name = handlebars.Utils.escapeExpression(`elections.${id}.${candidateName}`);

    let classes = 'oyster-candidate-input';

    if (options.hash.class) {
      classes += ` ${handlebars.Utils.escapeExpression(options.hash.class)}`;
    }

    const context = {
      id: name,
      name: candidateName,
      info: candidateInfo,
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

    const hbs = this.hbs = handlebars.create();

    try {
      fs.stat(this.path);
    } catch (err) {
      throw new Error(`No theme found at path: '${this.path}.`);
    }

    // Halpers!
    for (const helper in themeHelpers) {
      this.hbs.registerHelper(helper, themeHelpers[helper]);
    }
    HandlebarsIntl.registerWith(this.hbs);

    // The base of the theme.
    this.tmpls = {
      index: compileTemplate(hbs, path.join(this.path, 'index.hbs')),
      complete: compileTemplate(hbs, path.join(this.path, 'complete.hbs'))
    };

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

  render(tmplName, locals, options) {
    const tmpl = this.tmpls[tmplName];

    return tmpl.call(tmpl, locals, options);
  }
}

class ThemeManager {
  constructor(themePath) {
    this.cache = {};
    this.path = themePath;

    const themes = fs.readdirSync(themePath).filter(v => {
      return fs.statSync(path.join(themePath, v)).isDirectory();
    });

    themes.sort();

    Object.defineProperty(this, 'themes', {
      value: themes,
      enumerable: true
    });
  }

  load(themeName) {
    return new Theme(themeName, this.path);
  }

  get(themeName) {
    if (this.cache[themeName]) {
      return this.cache[themeName];
    }

    // if development mode
    if (config.development) {
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
    this.themeManager = themeMgr;

    this.renderTheme = function* renderTheme(themeName, tmplName, locals, options) {
      const l = extend(true, {}, this.state, locals);
      const o = extend(true, { data: {} }, options);

      o.data.ctx = this;

      const theme = themeMgr.get(themeName);

      o.data.theme = theme;

      this.type = 'html';
      return (this.body = theme.render(tmplName, l, o));
    };

    yield next;
  };
};
