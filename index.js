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

var models = require('./models'),
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
mongoose.connect('mongodb://localhost/oyster');
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

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
    this.ballot = yield this.poll.findBallot(token);

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
      content: this.poll.content
    });
  })
  .post('/poll/:poll/:token', bodyParser(), function *(next) {
    this.ballot.set('data', util.parseNestedKeys(this.request.body));

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
  if (this.user) {
    if (this.user.isAdmin()) {
      yield next;
    } else {
      return this.status = 403;
    }
  } else {
    this.request.query.r = encodeURIComponent(this.request.originalUrl);
    this.redirect('login');
  }
}

require('./auth');

secured
  .use(session(app))
  .use(passport.initialize())
  .use(passport.session())
  .get('login', '/login', function* (next) {
    if (this.user) {
      return this.body = "Already logged in.";
    } else {
      yield this.render('admin-login', {
        title: "Log in",
        submit: "Log in"
      });
    }
  })
  .post('/login', bodyParser(), passport.authenticate('local'), function* (next) {
    if (this.user) {
      return this.body = "Already logged in.";
    }

    if (this.request.query.r) {
      this.redirect(this.request.query.r);
    } else {
      this.redirect('/admin');
    }
  });

secured.prefix('/admin');

app
  .use(router.routes())
  .use(secured.routes())
  .use(router.allowedMethods());

console.log(router.stack.map(function(x) { return [ x.methods,  x.path ] }));
console.log(secured.stack.map(function(x) { return [ x.methods,  x.path ] }));
// Post-routing

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
      if (doc.endTime) {
        schedule.scheduleJob("end:" + doc.slug, doc.endTime, function(slug) {
          co(function* () {
            return yield calculateResults(slug);
          }).catch(function(e) {
            console.error("Failed to save results for '" + slug + "'.");
            console.error(e.stack);
          });
        }.bind(null, doc.slug));

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

  console.log('starting results scheduler.');
  startResultsScheduler();

  // TODO sanity check: ensure hasResults matches actual results collection

  app.listen(3000);
  console.log('listening on port 3000');
});
