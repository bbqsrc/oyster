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
      uuid = require('node-uuid'),
      Schema = mongoose.Schema;

const ballotSchema = new Schema({
  _id: { type: Buffer, index: { unique: true } },
  token: String,
  poll: String,
  flags: Array,
  data: Schema.Types.Mixed
});

// UUID _id so insertion order isn't assessable.
// Makes it harder to link order of tokens with Poll.emailsSent
ballotSchema.pre('save', function preSave(next) {
  if (this.isNew) {
    const buffer = new Buffer(16);

    uuid.v4(null, buffer, 0);
    this.set('_id', buffer);
    // FIXME: setting the subtype breaks saving in Mongoose.
    // this._id.subtype(0x04); // BSON subtype UUID
  }

  return next();
});

ballotSchema.statics.eachForSlug = function eachForSlug(slug, eachFn) {
  return new Promise((resolve, reject) => {
    const stream = this.find({
      poll: slug,
      data: { $exists: true }
    }).stream();

    stream
      .on('data', function() {
        try {
          eachFn.apply(this, arguments);
        } catch (err) {
          return reject(err);
        }
      })
      .on('error', reject)
      .on('end', resolve);
  });
};

ballotSchema.methods.getPoll = function getPoll() {
  return this.model('Poll').findOne({ slug: this.poll }).exec();
};

module.exports = mongoose.model('Ballot', ballotSchema);
