'use strict';

var process = require('process'),
    path = require('path'),
    app = require('koa')(),
    Log = require('huggare'),
    Router = require('koa-router'),
    bodyParser = require('koa-bodyparser'),
    mongoose = require('mongoose'),
    views = require('koa-views'),
    logger = require('koa-huggare'),
    helmet = require('koa-helmet'),
    session = require('koa-session'),
    passport = require('koa-passport'),
    moment = require('moment'),
    co = require('co');

Log.i(TAG, 'Loading config: ' + process.env.PWD + '/config.json');
var config = require('./config');

var models = require('./models'),
    util = require('./util'),
    loggers = require('./loggers'),
    router = Router(),
    secured = Router(),
    TAG = 'oyster';

// Pre-routing
if (config.logPath) {
  Log.addFormatter(loggers.FlatFileFormatter({
    path: config.logPath
  }));
} else {
  Log.w(TAG, 'no logPath specified; logging only to console.');
}

app.name = TAG;
app.keys = [config.cookieSecret];
app.proxy = config.proxy || true;

app.use(logger({
  exclude: /^\/static/
}));
app.use(views(path.resolve(__dirname, '../views'), {
  map: { html: 'jade' },
  default: 'jade'
}));
app.use(helmet.defaults());

Log.i(TAG, 'Connecting to mongodb...');
mongoose.connect(config.mongoURL);
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:')); // eslint-disable-line

// Catch all the errors.
app.use(function *(next) {
  try {
    yield next;
  } catch (err) {
    this.status = err.status || 500;
    //this.body = err.message;
    this.body = 'Internal server error. Please contact an administrator.';
    this.app.emit('error', err, this);
    Log.e(TAG, this.body, err);
  }
});

require('./auth');

app.use(session({
    key: config.cookieName,
    maxAge: config.cookieMaxAge
  }, app))
  .use(passport.initialize())
  .use(passport.session());

app.use(function *(next) {
  this.state = {
    moment: moment
  };
  yield next;
});

// Routes

util.routeStatic(router, '/static', path.resolve(__dirname, '../assets/static'));

router
  .param('poll', function *(slug, next) {
    this.poll = yield models.Poll.findBySlug(slug);

    if (!this.poll) {
      return this.status = 404;
    }

    yield next;
  })
  .param('token', function *(token, next) {
    this.ballot = yield models.Ballot.findOne({
      poll: this.poll.slug,
      token: token
    }).exec();

    if (!this.ballot) {
      return this.status = 404;
    }

    if (this.ballot.data != null) {
      this.status = 403;

      return yield this.render('success', {
        message: 'You have already responded to this poll.',
        pageTitle: this.poll.content.pageTitle,
        title: this.poll.content.title,
        ballot: util.reverseObject(this.ballot.data)
      });
    }

    let now = +Date.now();

    // Let us be only serving if within the good period of time oh yes.
    if (+this.poll.startTime > now) {
      this.status = 403;

      return yield this.render('error', {
        pageTitle: this.poll.content.pageTitle,
        title: this.poll.content.title,
        message: 'This poll has not yet begun.'
      });
    }
    if (+this.poll.endTime < now) {
      this.status = 403;

      return yield this.render('error', {
        pageTitle: this.poll.content.pageTitle,
        title: this.poll.content.title,
        message: 'This poll has finished.'
      });
    }

    yield next;
  })
  .get('/', function *() {
    // TODO stub
    return this.body = '<!doctype html><html><head><title>Oyster voting server</title>' +
        '<style>body { font-family: sans-serif; }</style></head>' +
        '<body><h1>The server is up!</h1>' +
        '<footer><small>Powered by <a href="https://bbqsrc.github.io/oyster">Oyster</a>.</small></footer>' +
        '</body></html>';
  })
  .get('/poll/:poll/:token', function *() {
    yield this.render('form', {
      content: this.poll.content,
      flags: this.ballot.flags
    });
  })
  .post('/poll/:poll/:token', bodyParser(), function *() {
    let data = util.parseNestedKeys(this.request.body);

    this.ballot.set('data', data);
    this.ballot.markModified('data');

    try {
      yield this.ballot.save();
    } catch(e) {
      Log.e(TAG, 'failure to save ballot', e);
      this.status = 500;
      return yield this.render('error', {
        pageTitle: this.poll.content.pageTitle,
        title: this.poll.content.title,
        message: 'For some reason, your ballot could not be saved. An error has been logged. Please try again in a few minutes, or contact the administrator.'
      });
    }

    yield this.render('success', {
      pageTitle: this.poll.content.pageTitle,
      title: this.poll.content.title,
      ballot: data
    });
  })
  .get('/export/:poll/results', pollPrecheck, function *() {
    return this.body = this.poll.results;
  })
  .get('/export/:poll/poll', pollPrecheck, function *() {
    let o = this.poll.toObject();
    delete o.emailsSent; // privacy
    delete o._id;
    return this.body = o;
  })
  .get('/export/:poll/ballots', pollPrecheck, function *() {
    return this.body = {
      poll: this.poll.slug,
      ballots: yield models.Ballot.find({poll: this.poll.slug}, {
        _id: 0, __v: 0
      }).exec()
    };
  })
  .get('/results/:poll', pollPrecheck, function *() {
    let totalBallots = yield models.Ballot.count({
      poll: this.poll.slug,
      data: { $exists: true }
    }).exec();

    if (this.poll.results) {
      return yield this.render('results', {
        title: 'Results - ' + this.poll.title,
        poll: this.poll,
        totalCompleteBallots: totalBallots
      });
    } else {
      return this.body = 'The results have not finished generating yet. Please try again later.';
    }
  });

function *pollPrecheck (next) {
  // Check if poll allows router results
  if (!this.poll.isPublic) {
    return this.status = 404; // mask existence
  }

  let now = Date.now();

  if (+this.poll.startTime > now) {
    this.status = 403;
    return this.body = 'The poll has not started yet.';
  }

  if (+this.poll.endTime > now) {
    this.status = 403;
    return this.body = 'The poll has not ended yet.';
  }

  yield next;
}

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

secured
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
        self.status = 401;
        self.redirect('login');
      } else {
        yield self.login(user);

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

secured.prefix('/admin');

app
  .use(router.routes())
  .use(secured.routes())
  .use(router.allowedMethods());

app.on('error', function(err, ctx) {
  Log.e(TAG, 'server error', err);
  if (ctx) {
    Log.e(TAG, 'server ctx:', ctx);
  }
});

// Post-routing
process.on('unhandledRejection', function(reason, p) {
  Log.e(TAG, 'Unhandled Rejection at: Promise ' + p + ' reason: ' + reason);
});

db.once('open', function() {
  Log.i(TAG, 'db connected.');
  co(function*() {
    Log.i(TAG, 'starting results scheduler.');
    // TODO sanity check: ensure hasResults matches actual results collection
    yield models.Poll.startScheduler();
  }).then(function() {
    app.listen(config.port);
    Log.i(TAG, 'listening on port ' + config.port);
  });
});
