'use strict';

var TAG = 'oyster/routes/secured';

var Log = require('huggare'),
    router = require('koa-router')(),
    bodyParser = require('koa-bodyparser'),
    passport = require('koa-passport'),
    models = require('../models');

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
      return this.body = 'Already logged in.';
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
      return this.body = 'Already logged in.';
    }

    yield passport.authenticate('local', function* (err, user) {
      if (err) throw err;

      if (user === false) {
        Log.w(TAG, 'failed login attempt for user "' +
                   self.request.body.username + '".');
        self.status = 401;
        self.redirect('login');
      } else {
        yield self.login(user);

        Log.w(TAG, 'successful log in for user "' +
                   self.request.body.username + '".');

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
      titles: 'All Participants',
      participants: pgs
    });
  })
  .get('/participant/:pgId', isAdmin, function* () {
    let pg = yield models.ParticipantGroup.findById(this.params.pgId).exec();

    if (!pg) {
      return this.status = 404;
    }

    // TODO themes.
    return this.body = JSON.stringify(pg.toObject(), null, 2);
  })
  .get('/polls', isAdmin, function* () {
    // TODO pagination!!

    let polls = yield models.Poll.find({}).exec();

    yield this.render('admin-polls', {
      title: 'All Polls',
      polls: polls
    });
  })
  .get('/polls/new', isAdmin, function* () {
    let participantGroups = yield models.ParticipantGroup.find({}).exec();

    yield this.render('admin-new-poll', {
      title: 'New Poll',
      participants: participantGroups
    });
  })
  .post('/polls/new', isAdmin, bodyParser(), function* () {
    let poll = yield models.Poll.createPoll(this.request.body);
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
      title: 'Poll - ' + this.poll.slug,
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
  .get('/poll/:poll/results', isAdmin, function* () {
    let results = yield this.poll.generateResults();

    yield this.render('admin-results', {
      title: 'Results - ' + this.poll.slug,
      poll: this.poll,
      results: results
    });
  })
  .get('/poll/:poll/export/results', isAdmin, function* () {
    return this.body = JSON.stringify(yield this.poll.generateResults(), null, 2);
  })
  .get('/*', isAdmin);

router.prefix('/admin');

module.exports = router;
