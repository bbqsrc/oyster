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

/**
 * Checks that the string is only an integer, potentially with leading
 * zeroes and with spaces at the beginning or end.
 */
function isStrictlyInt(v) {
  return /^\s*(?:(?!0+$)[0-9]+)?\s*$/.test(v);
}

function majorityQuota(v) {
  return (v / 2 | 0) + 1;
}

function validRankOrNull(x, min, max) {
  const min_ = min || 1;
  const max_ = max || Infinity;

  if (!isStrictlyInt(x)) {
    return null;
  }

  let v = x.trim();

  if (v === '') {
    return null;
  } else {
    v = parseInt(v, 10);
    if (v < min_ || Number.isNaN(v) || v > max_) {
      return null;
    }
  }

  return v;
}

class Counter {
  constructor(candidates) {
    this.length = candidates.length;

    this.c = {};
    for (const c of candidates) {
      this.c[c] = 0;
    }
  }

  inc(k) {
    this.c[k]++;
  }

  get total() {
    let v = 0;

    for (const k in this.c) {
      v += this.c[k];
    }

    return v;
  }

  ordered() {
    const x = [];

    for (const k in this.c) {
      x.push([this.c[k], k]);
    }

    return x.sort().reverse();
  }

  first() {
    return this.ordered()[0];
  }

  last() {
    return this.ordered()[this.length - 1];
  }
}

function arrayRemove(array, item) {
  const i = array.indexOf(item);

  if (i > -1) {
    array.splice(i, 1);
  }

  return array;
}

function transpose(array) {
  // Naively get m * n
  const m = array.length;
  const n = array[0].length;
  const o = [];

  for (let j = 0; j < n; ++j) {
    const p = [];

    for (let i = 0; i < m; ++i) {
      p.push(array[i][j]);
    }
    o.push(p);
  }

  return o;
}

function diff(arrayA, arrayB) {
  if (arrayA.length !== arrayB.length) {
    throw new TypeError('Arrays must be same length');
  }

  const len = arrayA.length;
  const o = [];

  for (let i = 0; i < len; ++i) {
    o.push(arrayA[i] - arrayB[i]);
  }

  return o;
}

module.exports = {
  isStrictlyInt,
  validRankOrNull,
  majorityQuota,
  Counter,
  arrayRemove,
  transpose,
  diff
};
