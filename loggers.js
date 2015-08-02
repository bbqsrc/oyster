"use strict";

var Log = require('huggare'),
    fs = require('fs');

var FlatFileFormatter = function(opts) {
  opts = opts || {};

  if (!opts.path) {
    throw new Error("opts.path required");
  }

  var stream = fs.createWriteStream(opts.path, {
    flags: 'a',
    encoding: 'utf8'
  });

  var p = [,,'V','D','I','W','E','A'];

  return function(ts, prio, tag, msg, tr) {
    if (opts.level && prop < opts.level) {
      return;
    }

    if (msg.stack) {
      tr = msg;
      msg = '';
    }

    switch (prio) {
      case Log.VERBOSE:
      case Log.DEBUG:
      case Log.INFO:
        stream.write(ts.toISOString() + " [" + p[prio] + "] " + tag + ": " + msg + "\n");
        if (tr) {
          stream.write(tr.stack);
          stream.write('\n');
        }
        break;
      case Log.WARN:
      case Log.ERROR:
      case Log.ASSERT:
        stream.write(ts.toISOString() + " [" + p[prio] + "] " + tag + ": " + msg);
        if (tr) {
          stream.write(tr.stack);
          stream.write('\n');
        }
        break;
      default:
        Log.wtf("FlatFileFormatter", "invalid priority specified: " + prio + ", logging as error.");
        Log.e(tag, msg, tr);
    }
  };
};

module.exports.FlatFileFormatter = FlatFileFormatter;
