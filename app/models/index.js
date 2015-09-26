'use strict';

module.exports = {
  User: require('passport-mongodb').User,
  Ballot: require('./ballot'),
  Poll: require('./poll'),
  ParticipantGroup: require('./participant-group')
};
