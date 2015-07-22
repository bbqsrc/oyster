"use strict";

var co = require('co'),
    passport = require('koa-passport'),
    LocalStrategy = require('passport-local').Strategy;

var models = require('./models');

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(new LocalStrategy(function(username, password, done) {
  co(function*() {
    let user = yield models.User.authenticate(username, password);

    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  }).catch(function(err) {
    return done(err);
  });
}));
