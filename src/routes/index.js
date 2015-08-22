'use strict';

var TAG = 'oyster/routes/index';

var Log = require('huggare'),
    router = require('koa-router')(),
    bodyParser = require('koa-bodyparser'),
    util = require('../util'),
    models = require('../models');

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
        message: this.i18n.__('You have already responded to this poll.'),
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
        message: this.i18n.__('This poll has not yet begun.')
      });
    }
    if (+this.poll.endTime < now) {
      this.status = 403;

      return yield this.render('error', {
        pageTitle: this.poll.content.pageTitle,
        title: this.poll.content.title,
        message: this.i18n.__('This poll has finished.')
      });
    }

    yield next;
  })
  .get('/', function *() {
    yield this.render('home', {
      title: this.i18n.__('Index')
    });
  })
  .get('/poll/:poll/:token', function *() {
    // TODO implement flags
    yield this.renderTheme(this.poll.theme, this.poll.content);
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
        message: this.i18n.__('For some reason, your ballot could not be saved. ' +
                              'An error has been logged. Please try again in a ' +
                              'few minutes, or contact the administrator.')
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
        title: this.i18n.__('Results') + ' - ' + this.poll.title,
        poll: this.poll,
        totalCompleteBallots: totalBallots
      });
    } else {
      return this.body = this.i18n.__('The results have not finished ' +
                                      'generating yet. Please try again later.');
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
    return this.body = this.i18n.__('The poll has not started yet.');
  }

  if (+this.poll.endTime > now) {
    this.status = 403;
    return this.body = this.i18n.__('The poll has not ended yet.');
  }

  yield next;
}

module.exports = router;
