"use strict";

var mongoose = require('mongoose'),
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
