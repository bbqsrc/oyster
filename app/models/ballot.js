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
      .on('data', () => {
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
