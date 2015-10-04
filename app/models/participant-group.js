/*!
 * Oyster, a free voting system.
 * Copyright © 2015  Brendan Molloy <brendan@bbqsrc.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * <one line to give the program's name and a brief idea of what it does.>
 */
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

module.exports = mongoose.model('participantSchemaGroup', participantGroupSchema);
