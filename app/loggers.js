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

const Log = require('huggare'),
      fs = require('fs');

function FlatFileFormatter(options) {
  const TAG = 'FlatFileFormatter';

  const opts = options || {};

  if (!opts.path) {
    throw new Error('opts.path required');
  }

  const stream = fs.createWriteStream(opts.path, {
    flags: 'a',
    encoding: 'utf8'
  });

  stream.on('error', err => {
    Log.wtf(TAG, 'stream has had a write error', err);
  });

  return function flatFileFormatter(ts, prio, tag, args) {
    if (opts.level && prio < opts.level) {
      return;
    }

    if (prio < Log.VERBOSE || prio > Log.ASSERT) {
      Log.wtf(TAG, 'invalid priority specified: ', prio, ', logging as error.');
      Log.e(tag, args);
      return;
    }

    if (args.message) {
      const shortName = this.SHORT_NAMES[prio];

      stream.write(`${ts.toISOString()} [${shortName}] ${tag}: ${args.message}\n`);
    }

    if (args.err) {
      stream.write(`${args.err.stack || args.err}\n`);
    }
  };
}

module.exports.FlatFileFormatter = FlatFileFormatter;
