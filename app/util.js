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

// nodejs util.
const util = require('util');

/** Splits on '.' into an object. */
exports.parseNestedKeys = function parseNestedKeys(obj) {
  const out = {};

  for (const key in obj) {
    const chunks = key.split('.');
    let tmp = out;

    for (let i = 0, ii = chunks.length - 1; i < ii; ++i) {
      if (tmp[chunks[i]] == null) {
        tmp[chunks[i]] = {};
      }
      tmp = tmp[chunks[i]];
    }

    tmp[chunks[chunks.length - 1]] = obj[key];
  }

  return out;
};

exports.reverseObject = function reverseObject(obj) {
  const o = Array.isArray(obj) ? [] : Object.create(null);

  Object.keys(obj).reverse().forEach(key => {
    if (util.isObject(obj[key])) {
      o[key] = reverseObject(obj[key]);
    } else {
      o[key] = obj[key];
    }
  });

  return o;
};
