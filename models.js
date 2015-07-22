"use strict";

var crypto = require('crypto'),
    mongoose = require('mongoose'),
    co = require('co'),
    Schema = mongoose.Schema;

var pollSchema = new Schema({
  slug: { type: String, unique: true },
  title: String,
  content: Schema.Types.Mixed,
  isPublic: { type: Boolean, default: true },
  participants: [{
    email: String,
    ballotSent: { type: Boolean, default: false }
  }],
  email: {
    from: String,
    subject: String,
    content: String
  },
  startTime: Date,
  endTime: Date,
  hasResults: { type: Boolean, default: false }
});

pollSchema.statics.findBySlug = /* async */ function(slug) {
  return this.findOne({ slug: slug }).exec();
};

pollSchema.methods.getBallots = /* async */ function() {
  return this.model('Ballot').find({ poll: this.slug }).exec();
};

pollSchema.methods.findBallot = /* async */ function(token) {
  return this.model('Ballot').findOne({ poll: this.slug, token: token }).exec();
}

exports.Poll = mongoose.model('Poll', pollSchema);

var ballotSchema = new Schema({
  token: String,
  poll: String,
  data: { type: Schema.Types.Mixed, default: null }
});

ballotSchema.methods.getPoll = /* async */ function() {
  return this.model('Poll').findOne({ slug: this.poll }).exec();
};

exports.Ballot = mongoose.model('Ballot', ballotSchema);

var resultsSchema = new Schema({
  poll: { type: String, unique: true },
  results: Schema.Types.Mixed
});

exports.Results = mongoose.model('Results', resultsSchema);

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
    let userModel = self.model('User');

    username = username.trim();
    if (username === "") {
      throw new Error("invalid username");
    }

    if (password == null || password === "") {
      throw new Error("invalid password");
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

        let user = new userModel({
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
}

userSchema.statics.authenticate = function(username, password) {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.model('User').findOne({username: username}, function(err, doc) {
      if (err) { return reject(err); }

      if (doc == null) {
        return resolve(false);
      }

      doc.verifyPassword(password).then(function(success) {
        resolve(success);
      }).catch(function(err) {
        reject(err);
      });
    });
  });
}

userSchema.methods.verifyPassword = function(password) {
  let self = this;

  return new Promise(function(resolve, reject) {
    crypto.pbkdf2(password, self.salt, self.iterations, self.hash.length, 'sha256', function(err, key) {
      if (err) { return reject(err); }

      return resolve(slowEquals(self.hash, key));
    });
  });
};

userSchema.methods.isAdmin = function() {
  return this.flags.indexOf('admin') > -1;
}

exports.User = mongoose.model('User', userSchema);
