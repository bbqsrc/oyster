"use strict";

var app = require('koa')(),
    Router = require('koa-router'),
    bodyParser = require('koa-bodyparser'),
    mongoose = require('mongoose'),
    views = require('koa-views'),
    logger = require('koa-logger'),
    helmet = require('koa-helmet'),
    session = require('koa-session'),
    passport = require('koa-passport'),
    co = require('co');

var config = require('./config'),
    models = require('./models'),
    util = require('./util'),
    router = Router(),
    secured = Router();

// Pre-routing

app.name = "oyster";
app.keys = [config.cookieSecret];
app.proxy = config.proxy || true;

app.use(logger());
app.use(views('assets/views', {
  map: { html: 'jade' },
  default: 'jade'
}));
app.use(helmet.defaults());

console.log('Connecting to mongodb...');
mongoose.connect(config.mongoURL);
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

// Catch all the errors.
app.use(function *(next) {
  try {
    yield next;
  } catch (err) {
    this.status = err.status || 500;
    this.body = err.message;
    this.app.emit('error', err, this);
  };
});

require('./auth');

app.use(session({
    key: config.cookieName,
    maxAge: config.cookieMaxAge
  }, app))
  .use(passport.initialize())
  .use(passport.session());

// Routes

util.routeStatic(router, '/static', __dirname + "/assets/static");

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
        message: "You have already responded to this poll.",
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
        message: "This poll has not yet begun."
      });
    }
    if (+this.poll.endTime < now) {
      this.status = 403;

      return yield this.render('error', {
        pageTitle: this.poll.content.pageTitle,
        title: this.poll.content.title,
        message: "This poll has finished."
      });
    }

    yield next;
  })
  .get('/', function *(next) {
    // TODO stub
    return this.body = "<!doctype html><html><head><title>Oyster voting server</title>" +
        "<style>body { font-family: sans-serif; }</style></head>" +
        "<body><h1>The server is up!</h1>" +
        "<footer><small>Powered by <a href='https://bbqsrc.github.io/oyster'>Oyster</a>.</small></footer>" +
        "</body></html>";
  })
  .get('/poll/:poll/:token', function *(next) {
    yield this.render('form', {
      content: this.poll.content,
      flags: this.ballot.flags
    });
  })
  .post('/poll/:poll/:token', bodyParser(), function *(next) {
    let data = util.parseNestedKeys(this.request.body);

    this.ballot.set('data', data);
    this.ballot.markModified('data');

    try {
      yield this.ballot.save();
    } catch(e) {
      console.error(e.stack);
      this.status = 500;
      return yield this.render('error', {
        pageTitle: this.poll.content.pageTitle,
        title: this.poll.content.title,
        message: "For some reason, your ballot could not be saved. An error has been logged. Please try again in a few minutes, or contact the administrator."
      });
    }

    yield this.render('success', {
      pageTitle: this.poll.content.pageTitle,
      title: this.poll.content.title,
      ballot: data
    });
  })
  .get('/results/:poll/export', function *(next) {
    // Only if ended, and if public.
  })
  .get('/results/:poll', function *(next) {
    // Check if poll allows router results
    if (!this.poll.isPublic) {
      return this.status = 403;
    }

    let now = +Date.now();

    if (+this.poll.startTime > now) {
      return this.body = "The poll hasn't started yet.";
    }

    if (+this.poll.endTime > now) {
      return this.body = "The poll hasn't ended yet.";
    }

    // TODO: instance method on Poll
    let results = yield models.Results.findOne({ poll: this.poll.slug });

    if (results) {
      return yield this.render('results', { data: results.data });
    } else {
      return this.body = "The results have not finished generating yet. Please try again later.";
    }
  });


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
  .get('logout', '/logout', function* (next) {
    this.logout();
    this.redirect('/admin/login');
  })
  .get('login', '/login', function* (next) {
    if (this.req.user) {
      return this.body = "Already logged in.";
    } else {
      yield this.render('admin-login', {
        title: "Log in",
        submit: "Log in"
      });
    }
  })
  .post('/login', bodyParser(), function* (next) {
    let self = this;

    if (this.req.user) {
      return this.body = "Already logged in.";
    }

    yield passport.authenticate('local', function* (err, user, info) {
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
  .get('/', isAdmin, function* (next) {
    yield this.render('admin-index', { title: 'Index' });
  })
  .get('/polls', isAdmin, function* (next) {
    // TODO pagination!!

    let polls = yield models.Poll.find({}).exec();

    yield this.render('admin-polls', {
      title: "All Polls",
      polls: polls
    });
  })
  .get('/polls/new', isAdmin, function* (next) {
    let participantGroups = yield models.ParticipantGroup.find({}).exec();

    yield this.render('admin-new-poll', {
      title: "New Poll",
      participants: participantGroups
    });
  })
  .post('/polls/new', isAdmin, bodyParser(), function* (next) {
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
  .get('/poll/:poll', isAdmin, function* (next) {
    yield this.render('admin-poll', {
      title: "Poll " + this.poll.slug,
      poll: this.poll
    });
  })
  .get('/poll/:poll/edit', isAdmin, function* (next) {
    let isEditable = +this.poll.startTime > +Date.now();

    return this.body = "TODO.";
  })
  .post('/poll/:poll/edit', isAdmin, function* (next) {
    let isEditable = +this.poll.startTime > +Date.now();

    return this.body = "TODO.";
  })
  .get('/poll/:poll/ballots', isAdmin, function* (next) {
    // TODO
    return this.body = "TODO.";
  });

secured.prefix('/admin');

app
  .use(router.routes())
  .use(secured.routes())
  .use(router.allowedMethods());

app.on('error', function(err, ctx) {
  if (ctx) {
    console.error('server error', err, ctx);
  } else {
    console.error('server error', err);
  }
});

// Post-routing

db.once('open', function() {
  console.log('db connected.');
  co(function*() {
    console.log('starting results scheduler.');
    // TODO sanity check: ensure hasResults matches actual results collection
    yield models.Results.startScheduler();
  }).then(function() {
    app.listen(config.port);
    console.log('listening on port ' + config.port);
  });
});
