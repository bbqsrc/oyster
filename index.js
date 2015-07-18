"use strict";

var app = require('koa')(),
    Router = require('koa-router'),
    bodyParser = require('koa-bodyparser'),
    mongoose = require('mongoose'),
    logger = require('koa-logger'),
    helmet = require('koa-helmet');

var models = require('./models'),
    router = Router();

// Pre-routing

app.use(logger());
app.use(helmet.defaults());

console.log('Connecting to mongodb...');
mongoose.connect('mongodb://localhost/oyster');
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

// Routes

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
      this.body = yield this.poll.getRespondedPage();
      return this.status = 403;
    }

    yield next;
  })
  .get('/poll/:poll/:token', function *(next) {
    this.body = yield this.poll.getBallotPage();
  })
  .post('/poll/:poll/:token', bodyParser(), function *(next) {
    this.ballot.set('data', this.request.body);
    this.ballot.save();

    this.body = yield this.poll.getSuccessPage();
  })
  .get('/results/:poll', function *(next) {
    // Check if poll allows public results
    if (!this.poll.isPublic) {
      return this.status = 403;
    }

    this.body = yield this.poll.getResultsPage();
  });

app
  .use(router.routes())
  .use(router.allowedMethods());

// Post-routing

db.once('open', function() {
  console.log('db connected.');

  app.listen(3000);
  console.log('listening on port 3000');
});
