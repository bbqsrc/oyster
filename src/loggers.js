'use strict';

var Log = require('huggare'),
    fs = require('fs');

var FlatFileFormatter = function(opts) {
  var TAG = 'FlatFileFormatter';

  opts = opts || {};

  if (!opts.path) {
    throw new Error('opts.path required');
  }

  var stream = fs.createWriteStream(opts.path, {
    flags: 'a',
    encoding: 'utf8'
  });

  stream.on('error', function(err) {
    Log.wtf(TAG, 'stream has had a write error', err);
  });

  return function(ts, prio, tag, args) {
    if (opts.level && prio < opts.level) {
      return;
    }

    if (prio < Log.VERBOSE || prio > Log.ASSERT) {
      Log.wtf(TAG, 'invalid priority specified: ', prio, ', logging as error.');
      Log.e(tag, args);
      return;
    }

    if (args.message) {
      stream.write(ts.toISOString() + ' [' + this.SHORT_NAMES[prio] + '] ' +
                   tag + ': ' + args.message + '\n');
    }

    if (args.err) {
      stream.write(args.err.stack || args.err);
      stream.write('\n');
    }
  };
};

module.exports.FlatFileFormatter = FlatFileFormatter;
