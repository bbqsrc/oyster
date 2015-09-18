'use strict';

var util = require('util'); // nodejs util.

/** Splits on '.' into an object. */
exports.parseNestedKeys = function (obj) {
  let out = {};

  for (let key in obj) {
    let chunks = key.split('.');
    let tmp = out;

    for (let i = 0, ii = chunks.length-1; i < ii; ++i) {
      if (tmp[chunks[i]] == null) {
        tmp[chunks[i]] = {};
      }
      tmp = tmp[chunks[i]];
    }

    tmp[chunks[chunks.length-1]] = obj[key];
  }

  return out;
};

exports.reverseObject = function reverseObject(obj) {
  let o = Object.create(null);

  Object.keys(obj).reverse().forEach(function(key) {
    if (util.isObject(obj[key])) {
      o[key] = reverseObject(obj[key]);
    } else {
      o[key] = obj[key];
    }
  });

  return o;
};
