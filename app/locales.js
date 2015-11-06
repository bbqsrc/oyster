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

const TAG = 'oyster/locales';

const yaml = require('js-yaml'),
      path = require('path'),
      fs = require('fs'),
      resolvePath = require('resolve-path'),
      tags = require('language-tags'),
      config = require('./provider').config;

function loadLocaleYaml(fpath) {
  const messages = yaml.safeLoad(fs.readFileSync(fpath, 'utf8'));

  const locale = path.basename(fpath, path.extname(fpath));

  return { locale, messages };
}

function splitTag(tag) {
  const t = [];
  const chunks = tag.split('-');

  while (chunks.length) {
    t.push(chunks.join('-'));
    chunks.pop();
  }

  return t;
}

class LocaleManager {
  constructor(localePath) {
    this.cache = {};

    this.path = localePath;
    this.fallback = 'en';
  }

  get(locale) {
    const tagChunks = splitTag(tags(locale).format());

    for (const tag of tagChunks) {
      if (this.cache[tag]) {
        return this.cache[tag];
      }

      const data = this.load(tag);

      if (data) {
        if (config.production) {
          this.cache[tag] = data;
        }

        return data;
      }
    }

    return this.get(this.fallback);
  }

  load(locale) {
    const fpath = `${resolvePath(this.path, locale)}.yml`;

    try {
      return loadLocaleYaml(fpath).messages;
    } catch (err) {
      if (err.name === 'YAMLException') {
        throw err;
      }
      
      return null;
    }
  }
}

module.exports = function locales(modOpts) {
  const opts = modOpts || {};

  if (!opts.path) {
    throw new TypeError('Missing opts.path.');
  }

  const localeMgr = new LocaleManager(opts.path);

  return function* appLocales(next) {
    this.intl = localeMgr;

    yield next;
  };
};
