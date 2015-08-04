'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var participantGroupSchema = new Schema({
  name: { type: String, unique: true },
  // TODO: emails should be participants, and contain objects with a required 'email' field.
  // This allows for traceable ballots eg organisational voting with 'name' field etc.
  emails: { type: Array, default: [] },
  flags: { type: Array, default: [] }
});

module.exports = mongoose.model('ParticipantGroup', participantGroupSchema);
