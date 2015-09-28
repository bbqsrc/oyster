'use strict';

const mongoose = require('mongoose'),
      Schema = mongoose.Schema,
      co = require('co');

const participantSchema = new Schema({
  email: { type: String },
  profile: {}
});

participantSchema.path('email').validate(email => {
  // Check for extra spaces
  const em = email.trim();

  return em === email && /^.+@.+\..+$/.test(em);
}, 'invalid email');

const participantGroupSchema = new Schema({
  name: { type: String, unique: true },
  participants: { type: [participantSchema], default: [] },
  flags: { type: [String], default: [] }
});

participantGroupSchema.methods.isDeletable = function isDeletable() {
  return co(function* co$isDeletable() {
    const polls = yield mongoose.model('Poll').count({
      participantGroups: this.name,
      results: { $exists: false }
    }).exec();

    return polls === 0;
  }.bind(this));
};

participantGroupSchema.methods.duplicateEmails = function duplicateEmails() {
  const emails = new Map();

  for (const p of this.participants) {
    const email = p.email;

    if (emails.has(email)) {
      emails.set(email, emails.get(email) + 1);
    } else {
      emails.set(email, 1);
    }
  }

  const dupes = {
    length: 0,
    emails: {}
  };

  for (const o of emails.entries()) {
    const k = o[0];
    const v = o[1];

    if (v > 1) {
      dupes.length++;
      dupes.emails[k] = v;
    }
  }

  return dupes;
};

participantGroupSchema.pre('save', function preSave(next) {
  const dupes = this.duplicateEmails();

  if (dupes.length) {
    const err = new Error('Duplicate emails found.');

    err.data = dupes;
    next(err);
  } else {
    next();
  }
});

module.exports = mongoose.model('ParticipantGroup', participantGroupSchema);
