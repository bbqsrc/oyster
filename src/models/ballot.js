'use strict';

var mongoose = require('mongoose'),
    uuid = require('node-uuid'),
    Schema = mongoose.Schema;

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
    // FIXME: setting the subtype breaks saving in Mongoose.
    //this._id.subtype(0x04); // BSON subtype UUID
  }
  return next();
});

ballotSchema.methods.getPoll = function() {
  return this.model('Poll').findOne({ slug: this.poll }).exec();
};

ballotSchema.statics.eachForSlug = function(slug, eachFn) {
  return new Promise(function(resolve, reject) {
    let stream = this.find({
      poll: slug,
      data: { $exists: true }
    }).stream();

    stream
      .on('data', function() {
        try {
          eachFn.apply(this, arguments);
        } catch(err) {
          return reject(err);
        }
      })
      .on('error', reject)
      .on('end', resolve);
  }.bind(this));
};

module.exports = mongoose.model('Ballot', ballotSchema);
