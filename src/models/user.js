'use strict';

var crypto = require('crypto'),
    mongoose = require('mongoose'),
    co = require('co'),
    Schema = mongoose.Schema;

var userSchema = new Schema({
  username: { type: String, unique: true }, // TODO ENFORCE LOWERCASE
  displayName: String,
  iterations: Number,
  salt: Schema.Types.Buffer,
  hash: Schema.Types.Buffer,
  flags: Array
});

// It sickens me that I had to write this.
// https://github.com/joyent/node/issues/8560
function slowEquals(bufferA, bufferB) {
  let buflenA = bufferA.length,
      buflenB = bufferB.length,
      diff = buflenA ^ buflenB;

  for (let i = 0; i < buflenA && i < buflenB; ++i) {
    diff |= bufferA[i] ^ bufferB[i];
  }

  return diff === 0;
}

userSchema.statics.createUser = function(username, password, options) {
  let self = this;
  options = options || {};

  return new Promise(function(resolve, reject) {
    username = username.trim();
    if (username === '') {
      throw new Error('invalid username');
    }

    if (password == null || password === '') {
      throw new Error('invalid password');
    }

    let iterations = options.iterations || 4096;
    let saltSize = options.saltSize || 128;
    let keyLength = options.keyLength || 2048;
    let flags = options.flags || [];

    // Generate salt.
    crypto.randomBytes(saltSize, function(err, saltBuffer) {
      if (err) return reject(err);

      // Generate password hash.
      crypto.pbkdf2(password, saltBuffer, iterations, keyLength, 'sha256', function(err, key) {
        if (err) return reject(err);

        let user = new self.model('User')({
          username: username.toLowerCase(),
          displayName: username,
          iterations: iterations,
          salt: saltBuffer,
          hash: key,
          flags: flags
        });

        co(function*() {
          yield user.save();

          resolve(user);
        }).catch(reject);
      });
    });
  });
};

userSchema.statics.authenticate = function(username, password) {
  return new Promise(function(resolve, reject) {
    this.findOne({username: username}, function(err, doc) {
      if (err) { return reject(err); }

      if (doc == null) {
        return resolve(false);
      }

      doc.verifyPassword(password).then(function(success) {
        if (success) {
          resolve(doc);
        } else {
          resolve(false);
        }
      }).catch(function(err) {
        reject(err);
      });
    });
  }.bind(this));
};

userSchema.methods.verifyPassword = function(password) {
  return new Promise(function(resolve, reject) {
    crypto.pbkdf2(password, this.salt, this.iterations, this.hash.length, 'sha256', function(err, key) {
      if (err) { return reject(err); }

      return resolve(slowEquals(this.hash, key));
    }.bind(this));
  }.bind(this));
};

userSchema.methods.isAdmin = function() {
  return this.flags.indexOf('admin') > -1;
};

module.exports = mongoose.model('User', userSchema);
