'use strict';

var passport = require('koa-passport'),
    passportMongo = require('passport-mongodb');

passportMongo.setup(passport);
