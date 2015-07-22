"use strict";

var mongoose = require('mongoose'),
    models = require('../models'),
    readline = require('readline'),
    co = require('co');

console.log("Connecting to database...");
mongoose.connect('mongodb://localhost/oyster');
var db = mongoose.connection;

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

db.once('open', function() {
  rl.question("Username: ", function(username) {
    rl.question("Password: ", function(password) {
      co(function*() {
        let user = yield models.User.createUser(username, password, {
          flags: ['admin']
        });

        console.log('User "' + user.username + '" created.');

        process.exit(0)
      }).catch(function(err) {
        console.error(err.stack);
        process.exit(1);
      });
    });
  });
});
