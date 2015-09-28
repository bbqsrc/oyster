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
