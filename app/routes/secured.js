'use strict';

var TAG = 'oyster/routes/secured';

var Log = require('huggare'),
    router = require('koa-router')(),
    bodyParser = require('koa-better-body'),
    passport = require('koa-passport'),
    models = require('../models'),
    util = require('../util'),
    path = require('path'),
    fs = require('mz/fs');

function *isAdmin (next) {
  if (this.req.user) {
    if (this.req.user.isAdmin()) {
      yield next;
    } else {
      return this.status = 403;
    }
  } else {
    this.redirect('/admin/login?r=' + encodeURIComponent(this.request.originalUrl)); // TODO dehardcode
  }
}

router
  .get('logout', '/logout', function* () {
    this.logout();
    this.redirect('/admin/login');
  })
  .get('login', '/login', function* () {
    if (this.req.user) {
      return this.body = this.i18n.__('Already logged in.');
    } else {
      yield this.render('admin-login', {
        title: 'Log in',
        submit: 'Log in'
      });
    }
  })
  .post('/login', bodyParser(), function* (next) {
    let self = this;

    if (this.req.user) {
      return this.body = this.i18n.__('Already logged in.');
    }

    yield passport.authenticate('mongodb', function* (err, user) {
      if (err) throw err;

      if (user === false) {
        Log.w(TAG, 'failed login attempt for user "' +
                   self.request.body.fields.username + '".');
        self.status = 401;
        self.redirect('login');
      } else {
        yield self.login(user);

        Log.w(TAG, 'successful log in for user "' +
                   self.request.body.fields.username + '".');

        if (self.request.query.r) {
          self.redirect(self.request.query.r);
        } else {
          self.redirect('/admin');
        }
      }
    }).call(this, next);
  })
  .get('/', isAdmin, function* () {
    yield this.render('admin-index', { title: 'Index' });
  })
  .get('/participants', isAdmin, function* () {
    let pgs = yield models.ParticipantGroup.find({}).exec();

    yield this.render('admin-participants', {
      titles: this.i18n.__('All Participants'),
      participants: pgs
    });
  })
  .post('/participants', isAdmin, bodyParser({ multipart: true }), function*() {
    let body = this.request.body;

    let data;
    try {
      data = yield fs.readFile(body.files.participants.path, {encoding: 'utf-8'});
    } catch (e) {
      Log.wtf(TAG, 'An uploaded file could not be read!', e);
      return this.status = 500;
    }

    let participants = data.split('\n').map(function(email) {
      return { email: email.trim() };
    }).filter(function(v) { return v != null && v.email.length > 0; });

    let flags = body.fields.flags.trim();
    if (flags === '') {
      flags = [];
    } else {
      flags = flags.split(/\s+/);
    }

    let pg = new models.ParticipantGroup({
      name: body.fields.name.trim(),
      participants: participants,
      flags: flags
    });

    try {
      yield pg.save();
    } catch(err) {
      // Duplicate emails
      if (err.data) {
        this.status = 409;
        return this.body = err.data;
      } else {
        throw err;
      }
    }

    return this.status = 200;
  })
  .get('/participant/:pgId', isAdmin, function* () {
    let pg = yield models.ParticipantGroup.findById(this.params.pgId).exec();

    if (!pg) {
      return this.status = 404;
    }

    // TODO themes.
    return this.body = JSON.stringify(pg.toObject(), null, 2);
  })
  .delete('/participant/:pgId', isAdmin, function*() {
    let pg = yield models.ParticipantGroup.findById(this.params.pgId).exec();

    if (!pg) {
      return this.status = 404;
    }

    if (yield pg.isDeletable()) {
      yield pg.remove();
      return this.status = 200;
    }

    this.status = 403;
    return this.body = 'This participant group is currently in use.';
  })
  .get('/polls', isAdmin, function* () {
    // TODO pagination!!

    let polls = yield models.Poll.find({}).exec();

    yield this.render('admin-polls', {
      title: this.i18n.__('All Polls'),
      polls: polls
    });
  })
  .get('/polls/new', isAdmin, function* () {
    let participantGroups = yield models.ParticipantGroup.find({}).exec();

    // TODO dehardcode
    let fp = path.join(__dirname, '../../content/themes');
    let themes = (yield fs.readdir(fp)).filter(function(v) {
      return fs.statSync(path.join(fp, v)).isDirectory();
    });

    themes.sort();

    yield this.render('admin-new-poll', {
      title: this.i18n.__('New Poll'),
      participants: participantGroups,
      themes: themes
    });
  })
  .post('/polls/new', isAdmin, bodyParser(), function* () {
    let poll = yield models.Poll.createPoll(this.request.body.fields);
    this.redirect('/admin/poll/' + poll.slug);
  })
  .param('poll', function *(slug, next) {
    this.poll = yield models.Poll.findBySlug(slug);

    if (!this.poll) {
      return this.status = 404;
    }

    yield next;
  })
  .get('/poll/:poll', isAdmin, function* () {
    yield this.render('admin-poll', {
      title: this.i18n.__('Poll') + ' - ' + this.poll.slug,
      poll: this.poll
    });
  })
  .get('/poll/:poll/edit', isAdmin, function* () {
    // this.poll.isEditable()

    return this.body = 'TODO.';
  })
  .post('/poll/:poll/edit', isAdmin, function* () {
    // this.poll.isEditable()

    return this.body = 'TODO.';
  })
  .get('/poll/:poll/ballots', isAdmin, function* () {
    // TODO
    return this.body = 'TODO.';
  })
  .get('/poll/:poll/test', isAdmin, function* () {
    let flags = []; // eslint-disable-line
    if (this.request.query.flags) {
      flags = this.request.query.flags.split(',');
    }

    // TODO: implement flag support for themes again
    if (!this.poll.theme) {
      Log.e(TAG, 'Poll', this.poll.slug, 'is missing a theme; defaulting to australia.');
      this.poll.theme = 'australia';
    }
    yield this.renderTheme(this.poll.theme, this.poll.content);
  })
  .delete('/poll/:poll', isAdmin, function* () {
    if (this.poll.isEditable()) {
      this.status = 403;
      return this.body = 'Cannot delete: poll has already been started.';
    }

    this.poll.cancel();
    yield this.poll.remove();

    // TODO dehardcode
    this.redirect('/admin/polls');
  })
  .post('/poll/:poll/test', isAdmin, bodyParser(), function* () {
    let data = util.parseNestedKeys(this.request.body.fields);

    return this.body = JSON.stringify(data, null, 2);
  })
  .get('/poll/:poll/results', isAdmin, function* () {
    let results = yield this.poll.generateResults();

    yield this.render('admin-results', {
      title: this.i18n.__('Results') + ' - ' + this.poll.slug,
      poll: this.poll,
      results: results
    });
  })
  .get('/poll/:poll/export/results', isAdmin, function* () {
    return this.body = JSON.stringify(yield this.poll.generateResults(), null, 2);
  })
  .get('/users', isAdmin, function* () {
    yield this.render('admin-users', {
      title: this.i18n.__('Users')
    });
  })
  .get('/change-password', isAdmin, function* () {
    yield this.render('admin-change-password', {
      title: this.i18n.__('Change Password')
    });
  })
  .post('/change-password', isAdmin, bodyParser(), function* () {
    let body = this.request.body;

    if (!body.currPassword || !body.password || !body.password2) {
      this.status = 400;
      return yield this.render('admin-change-password', {
        title: this.i18n.__('Change Password'),
        error: 'Some fields were missing data.'
      });
    }

    if (body.password !== body.password2) {
      return yield this.render('admin-change-password', {
        title: this.i18n.__('Change Password'),
        error: 'New password does not match in both fields.'
      });
    }

    let success = yield this.req.user.verifyPassword(body.currPassword);
    if (!success) {
      return yield this.render('admin-change-password', {
        title: this.i18n.__('Change Password'),
        error: 'Incorrect password.'
      });
    }

    let user = yield this.req.user.updatePassword(body.password);
    yield user.save();
    this.req.user = user;

    return yield this.render('admin-change-password', {
      title: this.i18n.__('Change Password'),
      success: 'Password successfully updated.'
    });
  })
  .get('/*', isAdmin);

router.prefix('/admin');

module.exports = router;
