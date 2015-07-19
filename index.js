"use strict";

var app = require('koa')(),
    schedule = require('node-schedule'),
    Router = require('koa-router'),
    bodyParser = require('koa-bodyparser'),
    mongoose = require('mongoose'),
    views = require('koa-views'),
    logger = require('koa-logger'),
    helmet = require('koa-helmet'),
    co = require('co');

var models = require('./models'),
    util = require('./util'),
    router = Router();

// Pre-routing

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

    yield next;
  })
  .param('token', function *(token, next) {
    this.ballot = yield this.poll.findBallot(token);

    if (!this.ballot) {
      return this.status = 404;
    }

    if (this.ballot.data != null) {
      this.body = "responded."; //yield this.poll.getRespondedPage();
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
      yield this.render('error', {
        message: "???" // TODO
      });
    }

    yield this.render('success');
  })
  .get('/results/:poll', function *(next) {
    // Check if poll allows public results
    if (!this.poll.isPublic) {
      return this.status = 403;
    }

    this.body = "results."; //yield this.poll.getResultsPage();
  });

app
  .use(router.routes())
  .use(router.allowedMethods());

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
