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
