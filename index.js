"use strict";

var app = require('koa')(),
    schedule = require('node-schedule'),
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

app.keys = ['lol sekrets are hawt'];

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

require('./auth');

app.use(session(app))
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

    let now = Date.now();

    // Let us be only serving if within the good period of time oh yes.
    if (this.poll.startTime > now ||
        this.poll.endTime < now) {
      return this.status = 403;
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
      this.body = "You have already responded.";
      return this.status = 403;
    }

    yield next;
  })
  .get('/poll/:poll/:token', function *(next) {
    yield this.render('form', {
      content: this.poll.content,
      flags: this.ballot.flags
    });
  })
  .post('/poll/:poll/:token', bodyParser(), function *(next) {
    this.ballot.set('data', util.parseNestedKeys(this.request.body));
    this.ballot.markModified('data');
    try {
      yield this.ballot.save();
    } catch(e) {
      console.error(e);
      this.status = 500;
      return yield this.render('error', {
        message: "???" // TODO
      });
    }

    yield this.render('success');
  })
  .get('/results/:poll', function *(next) {
    // Check if poll allows router results
    if (!this.poll.isPublic) {
      return this.status = 403;
    }

    // TODO: instance method on Poll
    let results = yield model.Results.findOne({ poll: this.poll.slug });

    if (results) {
      yield this.render('results', { data: results.data });
    } else {
      yield this.render('results-pending');
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
      polls: polls
    });
  })
  .get('/polls/new', isAdmin, function* (next) {
    let participantGroups = yield models.ParticipantGroup.find({}).exec();

    yield this.render('admin-new-poll', {
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
      poll: this.poll
    });
  })
  .get('/poll/:poll/edit', isAdmin, function* (next) {
    let isEditable = this.poll.startTime > Date.now();

    return this.body = "TODO.";
  })
  .post('/poll/:poll/edit', isAdmin, function* (next) {
    let isEditable = this.poll.startTime > Date.now();

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

// Post-routing

// TODO move into models.
function calculateResults(slug) {
  return new Promise(function(resolve, reject) {
    co(function*() {
      let poll = yield models.Poll.findBySlug(slug);

      let results = Object.create(null);

      let ballotStream = models.Ballot.find({ slug: slug }).stream();

      ballotStream.on('data', function (doc) {
        // TODO: generate the results
      })
      .on('error', reject)
      .on('close', function() {
        co(function*() {
          let resultsRecord = new models.Results({
            slug: slug,
            results: results
          });

          poll.set('hasResults', true);

          yield resultsRecord.save();
          yield poll.save();

          console.log("Saved results for '" + slug + "'.");

          resolve();
        }).catch(reject);
      });
    }).catch(reject);
  });
}

function startResultsScheduler() {
  return new Promise(function(resolve, reject) {
    let stream = models.Poll.find({ hasResults: { $ne : true } }).stream();

    stream.on('data', function(doc) {
      // TODO schedule beginning
      if (doc.startTime) {
        schedule.scheduleJob("start:" + doc.slug, doc.startTime, function() {
          co(function* () {
            console.log("Starting job: " + this.name);
            yield doc.sendEmails();
            console.log("Finished job: " + this.name);
          }.bind(this)).catch(function(e) {
            console.error("Failed to send emails for '" + doc.slug + "'.");
            console.error(e.stack);
          });
        });

        console.log("Scheduled start of '" + doc.slug +  "' for " + doc.startTime.toISOString());
      }

      if (doc.endTime) {
        schedule.scheduleJob("end:" + doc.slug, doc.endTime, function() {
          co(function* () {
            console.log("Starting job: " + this.name);
            yield calculateResults(doc.slug);
            console.log("Finished job: " + this.name);
          }.bind(this)).catch(function(e) {
            console.error("Failed to save results for '" + doc.slug + "'.");
            console.error(e.stack);
          });
        });

        console.log("Scheduled end of '" + doc.slug +  "' for " + doc.endTime.toISOString());
      }
    })
    .on('error', reject)
    .on('close', function() {
      resolve();
    });
  });
}

db.once('open', function() {
  console.log('db connected.');
  co(function*() {
    console.log('starting results scheduler.');
    // TODO sanity check: ensure hasResults matches actual results collection
    yield startResultsScheduler();
  }).then(function() {
    app.listen(config.port);
    console.log('listening on port ' + config.port);
  });
});
