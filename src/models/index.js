'use strict';

const
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    TOML = require('../toml');

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
  content: Schema.Types.Mixed,
  results: Schema.Types.Mixed,
  theme: String
});

pollSchema.methods.isEditable = function() {
  return +this.startTime > Date.now();
};

pollSchema.methods.contentAsTOML = function() {
  return TOML.stringify(this.content, function(key, value) {
    if (key === 'info' || key === 'body') {
      return '"""\n' + value.trim() + '\n"""';
    }
    return false;
  }, 0);
};

module.exports = {
  Poll: pollSchema
};
