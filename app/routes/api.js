'use strict';

const router = require('koa-router')(),
      bodyParser = require('koa-better-body'),
      models = require('../models');

// TODO don't repeat yourself!!
function* isAdmin(next) {
  if (this.req.user) {
    if (this.req.user.isIn('admin', 'superadmin')) {
      yield next;
    } else {
      return (this.status = 403);
    }
  } else {
    this.redirect(`/admin/login?r=${encodeURIComponent(this.request.originalUrl)}`);
  }
}

function ensureBodyHasKeys() {
  const args = [].slice.call(arguments);

  return function* ensureBodyHasKeys(next) { // eslint-disable-line no-shadow
    for (const key of args) {
      if (!this.request.body.fields[key]) {
        return (this.status = 400);
      }
    }

    yield next;
  };
}

router
.prefix('/api')
.use(function* setType(next) {
  this.type = 'application/json';
  yield next;
})
.get('/users', isAdmin, function* getUsers() {
  // TODO pagination
  const users = yield models.User.find({}, { username: 1, flags: 1 }).exec();

  this.body = { users };
})
.post('/users', isAdmin, bodyParser(),
ensureBodyHasKeys('username', 'password', 'role'),
function* postUsers() {
  if (!this.req.user.is('superadmin')) {
    return (this.status = 403);
  }

  let roles;

  if (this.request.body.fields.role === 'superadmin') {
    roles = ['admin', 'superadmin'];
  } else if (this.request.body.fields.role === 'admin') {
    roles = ['admin'];
  } else {
    return (this.status = 400);
  }

  const user = yield models.User.createUser(
    this.request.body.fields.username,
    this.request.body.fields.password, {
      flags: roles
    });

  this.body = {
    _id: user._id,
    username: user.username,
    flags: user.flags
  };
  return;
})
.put('/user/:userId', isAdmin, bodyParser(),
ensureBodyHasKeys('role'),
function* putUsers() {
  if (!this.req.user.is('superadmin')) {
    return (this.status = 403);
  }

  const role = this.request.body.fields.role;

  if (role !== 'admin' && role !== 'superadmin') {
    return (this.status = 400);
  }

  const user = yield models.User.findOne({
    _id: this.params.userId
  }).exec();

  if (!user) {
    return (this.status = 404);
  }

  user.flags = ['admin'];
  if (role === 'superadmin') {
    user.flags.push(role);
  }
  user.markModified('flags');

  yield user.save();

  this.body = {
    _id: user._id,
    username: user.username,
    flags: user.flags
  };
  return;
})
.delete('/user/:userId', isAdmin, function* deleteUser() {
  if (!this.req.user.is('superadmin')) {
    return (this.status = 403);
  }

  const user = yield models.User.findOne({
    _id: this.params.userId
  }).exec();

  if (!user) {
    return (this.status = 404);
  }

  yield user.remove();

  return (this.status = 200);
});

module.exports = router;
