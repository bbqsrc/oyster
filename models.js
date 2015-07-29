"use strict";

var crypto = require('crypto'),
    mongoose = require('mongoose'),
    moment = require('moment'),
    uuid = require('node-uuid'),
    schedule = require('node-schedule'),
    co = require('co'),
    config = require('./config'),
    Schema = mongoose.Schema;

var pollSchema = new Schema({
  slug: { type: String, unique: true },
  title: String,
  isPublic: { type: Boolean, default: true },
  participantGroups: Array,
  emailsSent: { type: Array, default: [] },
  email: {
    from: String,
    subject: String,
    content: String
  },
  startTime: Date,
  endTime: Date,
  hasResults: { type: Boolean, default: false },
  content: Schema.Types.Mixed
});

pollSchema.statics.createPoll = function(o) {
  let self = this;

  return new Promise(function(resolve, reject) {
    co(function*() {
      let dateFormat = "YYYY-MM-DDhh:mmZ",
          timezone = (parseInt(o.timezone, 10) >= 0 ? "+" : "-") + o.timezone,
          startTime = moment(o.startDate + o.startTime +
                             timezone, dateFormat).toDate(),
          endTime = moment(o.endDate + o.endTime +
                           timezone, dateFormat).toDate(),
          participants = o.participants,
          pollData = JSON.parse(o.pollData);

      if (typeof participants == "string") {
          participants = [participants];
      }

      let poll = new (self.model('Poll'))({
        slug: o.slug,
        title: o.title,
        isPublic: o.isPublic === "on",
        participantGroups: participants,
        email: {
          from: o.emailFrom,
          subject: o.emailSubject,
          content: o.emailBody
        },
        startTime: startTime,
        endTime: endTime,
        content: pollData
      });

      yield poll.save();

      poll.schedule();

      resolve(poll);
    }).catch(reject);
  });
}

pollSchema.statics.findBySlug = /* async */ function(slug) {
  return this.findOne({ slug: slug }).exec();
};

pollSchema.methods.schedule = function() {
  let doc = this;

  let jobStartName = "start:" + doc.slug,
      jobEndName = "end:" + doc.slug;

  schedule.cancelJob(jobStartName);
  schedule.cancelJob(jobEndName);

  let now = +Date.now();

  if (doc.startTime) {
    // Don't bother if already ended.
    if (!(doc.endTime && +doc.endTime < now)) {
      schedule.scheduleJob(jobStartName, doc.startTime, function() {
        co(function* () {
          console.log("Starting job: " + this.name);
          yield doc.sendEmails();
          console.log("Finished job: " + this.name);
        }.bind(this)).catch(function(e) {
          console.error("Failed to send emails for '" + doc.slug + "'.");
          console.error(e.stack);
        });
      });

      console.log("Scheduled start of '" + doc.slug +  "' for " + doc.startTime.toISOString());
    }
  }

  if (doc.endTime) {
    schedule.scheduleJob(jobEndName, doc.endTime, function() {
      co(function* () {
        console.log("Starting job: " + this.name);
        yield doc.model('Results').createResults(doc);
        console.log("Finished job: " + this.name);
      }.bind(this)).catch(function(e) {
        console.error("Failed to save results for '" + doc.slug + "'.");
        console.error(e.stack);
      });
    });

    console.log("Scheduled end of '" + doc.slug +  "' for " + doc.endTime.toISOString());
  }
};

pollSchema.methods.sendEmails = function() {
  let self = this;

  return new Promise(function(resolve, reject) {
    co(function*() {
      let pgs = yield self.model('ParticipantGroup').find({ name: {
        $in : self.participantGroups } }).exec();

      if (pgs.length !== self.participantGroups.length) {
        return reject(new Error('Incorrect number of participant groups returned.'));
      }

      let baseUrl = config.host;
      let mailer = config.createMailer();

      for (let pg of pgs) {
        // TODO immediately finish generating the UUIDs, add the flags to the ballot,
        // create the empty ballot.
        for (let email of pg.emails) {
          if (self.emailsSent.indexOf(email) > -1) {
            continue;
          }

          let token = uuid.v4().replace(/-/g, '');

          let ballot = new (self.model('Ballot'))({
            token: token,
            poll: self.slug,
            flags: pg.flags
          });

          let url = "https://" + baseUrl + "/poll/" + self.slug + "/" + token;
          let text = self.email.content.replace("{url}", url);

          yield mailer.sendMail({
            from: self.email.from,
            to: email,
            subject: self.email.subject,
            text: text
          });

          self.emailsSent.push(email);
          self.markModified('emailsSent');
          yield self.save();
          yield ballot.save();
        }
      }

      resolve();
    }).catch(reject);
  });
};

exports.Poll = mongoose.model('Poll', pollSchema);

var ballotSchema = new Schema({
  _id: { type: Buffer, index: { unique: true } },
  token: String,
  poll: String,
  flags: Array,
  data: Schema.Types.Mixed
});

// UUID _id so insertion order isn't assessable.
// Makes it harder to link order of tokens with Poll.emailsSent
ballotSchema.pre('save', function(next) {
  if (this.isNew) {
    let buffer = new Buffer(16);
    uuid.v4(null, buffer, 0);
    this.set('_id', buffer);
    // BUG: setting the subtype breaks saving in Mongoose.
    //this._id.subtype(0x04); // BSON subtype UUID
  }
  return next();
});

ballotSchema.methods.getPoll = /* async */ function() {
  return this.model('Poll').findOne({ slug: this.poll }).exec();
};

exports.Ballot = mongoose.model('Ballot', ballotSchema);

var resultsSchema = new Schema({
  poll: { type: String, unique: true },
  results: Schema.Types.Mixed
});

resultsSchema.statics.createResults = function(poll) {
  let self = this;

  return new Promise(function(resolve, reject) {
    co(function*() {
      if (poll.hasResults) {
        throw new Error("This poll already has results.");
      }

      let results = Object.create(null);

      let slug = poll.slug;

      let ballotStream = self.model('Ballot').find({ slug: slug }).stream();

      ballotStream.on('data', function (doc) {
        // TODO: generate the results
      })
      .on('error', reject)
      .on('close', function() {
        co(function*() {
          let resultsRecord = new (self.model('Results'))({
            slug: slug,
            results: results
          });

          poll.set('hasResults', true);

          yield resultsRecord.save();
          yield poll.save();

          console.log("Saved results for '" + slug + "'.");

          resolve(resultsRecord);
        }).catch(reject);
      });
    }).catch(reject);
  });
};

resultsSchema.statics.startScheduler = function() {
  let self = this;

  return new Promise(function(resolve, reject) {
    let stream = self.model('Poll').find({ hasResults: { $ne : true } }).stream();

    stream.on('data', function(doc) {
      doc.schedule();
    })
    .on('error', reject)
    .on('close', function() {
      resolve();
    });
  });
};

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
        if (success) {
          resolve(doc);
        } else {
          resolve(false);
        }
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

var participantGroupSchema = new Schema({
  name: { type: String, unique: true },
  emails: { type: Array, default: [] },
  flags: { type: Array, default: [] }
});

exports.ParticipantGroup = mongoose.model('ParticipantGroup', participantGroupSchema);
