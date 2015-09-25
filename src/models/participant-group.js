'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    co = require('co');

var participantSchema = new Schema({
  email: { type: String },
  profile: {}
});

participantSchema.path('email').validate(function(email) {
  // Check for extra spaces
  let em = email.trim();
  return em === email && /^.+@.+\..+$/.test(em);
}, 'invalid email');

var participantGroupSchema = new Schema({
  name: { type: String, unique: true },
  participants: { type: [participantSchema], default: [] },
  flags: { type: [String], default: [] }
});

participantGroupSchema.methods.isDeletable = function() {
  return co(function*() {
    let polls = yield mongoose.model('Poll').count({
      participantGroups: this.name,
      results: { $exists: false }
    }).exec();

    return polls === 0;
  }.bind(this));
};

participantGroupSchema.methods.duplicateEmails = function() {
  let emails = new Map();

  for (let p of this.participants) {
    let email = p.email;

    if (emails.has(email)) {
      emails.set(email, emails.get(email) + 1);
    } else {
      emails.set(email, 1);
    }
  }

  let dupes = {
    length: 0,
    emails: {}
  };

  for (let o of emails.entries()) {
    let k = o[0];
    let v = o[1];

    if (v > 1) {
      dupes.length++;
      dupes.emails[k] = v;
    }
  }

  return dupes;
};

participantGroupSchema.pre('save', function(next) {
  let dupes = this.duplicateEmails();

  if (dupes.length) {
    let err = new Error('Duplicate emails found.');
    err.data = dupes;

    next(err);
  } else {
    next();
  }
});

module.exports = mongoose.model('participantSchemaGroup', participantGroupSchema);
