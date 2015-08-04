'use strict'; /* eslint-disable no-console */

var mongoose = require('mongoose'),
    config = require('../src/config'),
    models = require('../src/models'),
    fs = require('fs'),
    co = require('co');

var argv = require('minimist')(process.argv.slice(2));

if (argv._.length < 2) {
  console.log('Usage: <emails file> <group name> [flags]');
  process.exit(0);
}

console.log('Connecting to ' + config.mongoURL + '...');
mongoose.connect(config.mongoURL);
var db = mongoose.connection;

db.once('open', function() {
  co(function*() {
    let data = fs.readFileSync(argv._[0], {encoding: 'utf-8'});

    let emails = data.split('\n').map(function(email) {
      return email.trim();
    }).filter(function(v) { return v != null && v.length > 0; });

    let pg = new models.ParticipantGroup({
      name: argv._[1].trim(),
      emails: emails,
      flags: argv._.slice(2)
    });

    yield pg.save();

    console.log('Participant group "' + pg.name + '" created, with ' +
                pg.emails.length + ' emails.');

    process.exit(0);
  }).catch(function(err) {
    console.error(err.stack);
    process.exit(1);
  });
});
