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
 */
'use strict';

const mongoose = require('mongoose'),
      moment = require('moment'),
      co = require('co'),
      Schema = mongoose.Schema,
      tomlify = require('tomlify-j0.4');

const pollSchema = new Schema({
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
  content: Schema.Types.Mixed,
  results: Schema.Types.Mixed,
  theme: String
});

pollSchema.statics.createPoll = function createPoll(o) {
  return co(function* co$createPoll() {
    const dateFormat = 'YYYY-MM-DDhh:mmZ',
          timezone = (parseInt(o.timezone, 10) >= 0 ? '+' : '-') + o.timezone,
          startTime = moment(o.startDate + o.startTime +
                             timezone, dateFormat).toDate(),
          endTime = moment(o.endDate + o.endTime +
                           timezone, dateFormat).toDate(),
          pollData = JSON.parse(o.pollData);

    let participants = o.participants;

    if (typeof participants === 'string') {
      participants = [participants];
    }

    const poll = new (this.model('Poll'))({
      slug: o.slug,
      title: o.title,
      isPublic: o.isPublic === 'on',
      participantGroups: participants,
      email: {
        from: o.emailFrom,
        subject: o.emailSubject,
        content: o.emailBody
      },
      startTime,
      endTime,
      content: pollData,
      theme: o.theme
    });

    yield poll.save();

    return poll;
  }.bind(this));
};

pollSchema.statics.findBySlug = function findBySlug(slug) {
  return this.findOne({ slug }).exec();
};

pollSchema.methods.isEditable = function isEditable() {
  return +this.startTime > Date.now();
};

// TODO: ...
const util = require('../util');

pollSchema.methods.contentAsTOML = function contentAsTOML() {
  return tomlify(util.reverseObject(this.content), (key, value) => {
    if (key === 'info' || key === 'body') {
      return `"""\n${value.trim()}\n"""`;
    }
    return false;
  }, 0);
};

module.exports = mongoose.model('Poll', pollSchema);
