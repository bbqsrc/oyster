/*!
 * Oyster, a free voting system.
 * Copyright © 2015  Brendan Molloy <brendan@bbqsrc.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * <one line to give the program's name and a brief idea of what it does.>
 */
'use strict';

const TAG = 'oyster/routes/index';

const Log = require('huggare'),
      router = require('koa-router')(),
      bodyParser = require('koa-better-body'),
      util = require('../util'),
      models = require('../models');

router
/*
.get('/alt-test', function*() {
  return this.body = `<html><head>
  <link href="/static/css/bootstrap.min.css" rel="stylesheet">
  <link href="/static/css/admin.css" rel="stylesheet">
  <script src="/static/js/mongoose.min.js"></script>
  <script src="/static/js/vendor.min.js"></script>
  <script src="/static/js/components.min.js"></script>
  </head><body><div class='container'><div class='row'><div class='col-md-12' id='yay'></div></div></div><script>
  Oyster.insertComponent(Oyster.PollEditor, {}, '#yay');
  </script></body></html>`;
})
.put('/alt-test', bodyParser(), function*() {
  Log.i(TAG, '', this.request.body);
})
*/
  .param('poll', function* paramPoll(slug, next) {
    this.poll = yield models.Poll.findBySlug(slug);

    if (!this.poll) {
      return (this.status = 404);
    }

    yield next;
  })
  .param('token', function* paramToken(token, next) {
    this.ballot = yield models.Ballot.findOne({
      poll: this.poll.slug,
      token
    }).exec();

    if (!this.ballot) {
      return (this.status = 404);
    }

    if (this.ballot.data != null) {
      this.status = 403;

      const localeData = this.intl.get(this.state.locale);

      return yield this.renderTheme(this.poll.theme, 'complete', {
        messageKey: 'poll.alreadyResponded',
        title: this.poll.content.title,
        ballot: util.reverseObject(this.ballot.data)
      }, {
        data: { intl: localeData }
      });
    }

    const now = +Date.now();

    // Let us be only serving if within the good period of time oh yes.
    if (+this.poll.startTime > now) {
      this.status = 403;

      const localeData = this.intl.get(this.state.locale);

      return yield this.renderTheme(this.poll.theme, 'complete', {
        title: this.poll.content.title,
        messageKey: 'poll.notStarted'
      }, {
        data: { intl: localeData }
      });
    }

    if (+this.poll.endTime < now) {
      this.status = 403;

      const localeData = this.intl.get(this.state.locale);

      return yield this.renderTheme(this.poll.theme, 'complete', {
        title: this.poll.content.title,
        messageKey: 'poll.ended'
      }, {
        data: { intl: localeData }
      });
    }

    yield next;
  })
  .get('/', function* getRoot() {
    yield this.render('home', {
      title: this.translate('index')
    });
  })
  .get('/poll/:poll/:token', function* getPollForToken() {
    // TODO implement flags
    const localeData = this.intl.get(this.state.locale);

    yield this.renderTheme(this.poll.theme, 'index', this.poll.content, {
      data: { intl: localeData }
    });
  })
  .post('/poll/:poll/:token', bodyParser(), function* postPollForToken() {
    const data = util.parseNestedKeys(this.request.body.fields);

    this.ballot.set('data', data);
    this.ballot.markModified('data');

    const localeData = this.intl.get(this.state.locale);

    try {
      yield this.ballot.save();
    } catch (e) {
      Log.e(TAG, 'failure to save ballot', e);
      this.status = 500;
      return yield this.renderTheme(this.poll.theme, 'complete', {
        title: this.poll.content.title,
        messageKey: 'ballot.submission.error'
      }, {
        data: { intl: localeData }
      });
    }

    yield this.renderTheme(this.poll.theme, 'complete', {
      title: this.poll.content.title,
      ballot: data
    }, {
      data: { intl: localeData }
    });
  })
  .get('/export/:poll/results', pollPrecheck,
  function* getExportedPollResults() {
    return (this.body = this.poll.results);
  })
  .get('/export/:poll/poll', pollPrecheck,
  function* getExportedPollData() {
    const o = this.poll.toObject();

    // privacy
    delete o.emailsSent;
    delete o._id;

    return (this.body = o);
  })
  .get('/export/:poll/ballots', pollPrecheck,
  function* getExportedPollBallots() {
    this.body = {
      poll: this.poll.slug,
      ballots: yield models.Ballot.find({ poll: this.poll.slug }, {
        _id: 0, __v: 0
      }).exec()
    };
    return;
  })
  .get('/results/:poll', pollPrecheck, function* getPollResults() {
    const totalBallots = yield models.Ballot.count({
      poll: this.poll.slug,
      data: { $exists: true }
    }).exec();

    if (this.poll.results) {
      return yield this.render('results', {
        title: this.translate('results.title', {
          title: this.poll.title
        }),
        poll: this.poll,
        totalCompleteBallots: totalBallots
      });
    } else {
      this.body = this.translate('results.genIncomplete');
      return;
    }
  });

function* pollPrecheck(next) {
  // Check if poll allows router results
  if (!this.poll.isPublic) {
    // mask existence
    return (this.status = 404);
  }

  const now = Date.now();

  if (+this.poll.startTime > now) {
    this.status = 403;
    return (this.body = this.translate('poll.notStarted'));
  }

  if (+this.poll.endTime > now) {
    this.status = 403;
    return (this.body = this.translate('poll.notEnded'));
  }

  yield next;
}

module.exports = router;
