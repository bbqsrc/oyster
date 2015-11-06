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

const TAG = 'oyster/routes/secured';

const Log = require('huggare'),
      router = require('koa-router')(),
      bodyParser = require('koa-better-body'),
      passport = require('koa-passport'),
      models = require('../models'),
      util = require('../util'),
      config = require('../provider').config,
      fs = require('mz/fs'),
      extend = require('extend');

// TODO don't repeat yourself
function* isAdmin(next) {
  if (this.req.user) {
    if (this.req.user.isAdmin()) {
      yield next;
    } else {
      return (this.status = 403);
    }
  } else {
    this.redirect(`/admin/login?r=${encodeURIComponent(this.request.originalUrl)}`);
  }
}

router
  .get('logout', '/logout', function* getLogout() {
    this.logout();
    this.redirect('/admin/login');
  })
  .get('login', '/login', function* getLogin() {
    if (this.req.user) {
      return (this.body = this.i18n.__('Already logged in.'));
    } else {
      yield this.render('admin-login', {
        title: 'Log in',
        submit: 'Log in'
      });
    }
  })
  .post('/login', bodyParser(), function* postLogin(next) {
    const self = this;

    if (this.req.user) {
      return (this.body = this.i18n.__('Already logged in.'));
    }

    yield passport.authenticate('mongodb', function* callback(err, user) {
      if (err) {
        throw err;
      }

      const username = self.request.body.fields.username;

      if (user === false) {
        Log.w(TAG, `failed login attempt for user "${username}".`);
        self.status = 401;
        self.redirect('login');
      } else {
        yield self.login(user);

        Log.w(TAG, `successful log in for user "${username}".`);

        if (self.request.query.r) {
          self.redirect(self.request.query.r);
        } else {
          self.redirect('/admin');
        }
      }
    }).call(this, next);
  })
  .get('/', isAdmin, function* getRoot() {
    yield this.render('admin-index', { title: 'Index' });
  })
  .get('/participants', isAdmin, function* getParticipants() {
    const pgs = yield models.ParticipantGroup.find({}).exec();

    yield this.render('admin-participants', {
      title: this.i18n.__('Participants'),
      participants: pgs
    });
  })
  .post('/participants', isAdmin, bodyParser({ multipart: true }),
  function* postParticipants() {
    const fields = this.request.body.fields;
    const files = this.request.body.files;

    let data;

    try {
      data = yield fs.readFile(files.participants.path, { encoding: 'utf-8' });
    } catch (e) {
      Log.wtf(TAG, 'An uploaded file could not be read!', e);
      return (this.status = 500);
    }

    const participants = data.split('\n').map(email => {
      return { email: email.trim() };
    }).filter(v => {
      return v != null && v.email.length > 0;
    });

    let flags = fields.flags.trim();

    if (flags === '') {
      flags = [];
    } else {
      flags = flags.split(/\s+/);
    }

    const name = fields.name.trim();

    const pg = new models.ParticipantGroup({
      name,
      participants,
      flags
    });

    try {
      yield pg.save();
    } catch (err) {
      // Duplicate emails
      if (err.data) {
        this.status = 409;
        return (this.body = err.data);
      } else if (/ValidationError/.test(err.name)) {
        this.status = 400;
        return (this.body = 'Invalid data');
      } else {
        throw err;
      }
    }

    return (this.status = 200);
  })
  .get('/participant/:pgId', isAdmin, function* getParticipantGroup() {
    const pg = yield models.ParticipantGroup.findById(this.params.pgId).exec();

    if (!pg) {
      return (this.status = 404);
    }

    // TODO themes.
    return (this.body = JSON.stringify(pg.toObject(), null, 2));
  })
  .delete('/participant/:pgId', isAdmin, function* deleteParticipantGroup() {
    const pg = yield models.ParticipantGroup.findById(this.params.pgId).exec();

    if (!pg) {
      return (this.status = 404);
    }

    if (yield pg.isDeletable()) {
      yield pg.remove();
      return (this.status = 200);
    }

    this.status = 403;
    return (this.body = this.i18n.__('This participant group is currently in use.'));
  })
  .get('/polls', isAdmin, function* getPolls() {
    // TODO pagination!!

    const polls = yield models.Poll.find({}).exec();

    yield this.render('admin-polls', {
      title: this.i18n.__('All Polls'),
      polls
    });
  })
  .get('/polls/new', isAdmin, function* getNewPoll() {
    const participantGroups = yield models.ParticipantGroup.find({}).exec();

    // TODO dehardcode
    /*
    let fp = path.join(__dirname, '../../content/themes');
    let themes = (yield fs.readdir(fp)).filter(function(v) {
      return fs.statSync(path.join(fp, v)).isDirectory();
    });
    themes.sort();
    */
    const themes = this.themeManager.themes;

    yield this.render('admin-new-poll', {
      title: this.i18n.__('New Poll'),
      participants: participantGroups,
      themes
    });
  })
  .post('/polls/new', isAdmin, bodyParser(), function* postNewPoll() {
    const poll = yield models.Poll.createPoll(this.request.body.fields);

    this.redirect(`/admin/poll/${poll.slug}`);
  })
  .param('poll', function* paramPoll(slug, next) {
    this.poll = yield models.Poll.findBySlug(slug);

    if (!this.poll) {
      return (this.status = 404);
    }

    yield next;
  })
  .get('/poll/:poll', isAdmin, function* getPoll() {
    yield this.render('admin-poll', {
      title: `${this.i18n.__('Poll')} - ${this.poll.slug}`,
      poll: this.poll
    });
  })
  .get('/poll/:poll/test', isAdmin, function* getTestPoll() {
    let flags = []; // eslint-disable-line no-unused-vars

    if (this.request.query.flags) {
      flags = this.request.query.flags.split(',');
    }

    // TODO: implement flag support for themes again
    if (!this.poll.theme) {
      Log.e(TAG, 'Poll', this.poll.slug, 'is missing a theme; defaulting to australia.');
      this.poll.theme = 'slovenia';
    }

    const localeData = this.intl.get(this.state.locale);

    yield this.renderTheme(this.poll.theme, 'index', this.poll.content, {
      data: { intl: localeData }
    });
  })
  .delete('/poll/:poll', isAdmin, function* deletePoll() {
    if (this.poll.isEditable()) {
      this.status = 403;
      return (this.body = 'Cannot delete: poll has already been started.');
    }

    this.poll.cancel();
    yield this.poll.remove();

    // TODO dehardcode
    this.redirect('/admin/polls');
  })
  .post('/poll/:poll/test', isAdmin, bodyParser(), function* postTestPoll() {
    const data = util.parseNestedKeys(this.request.body.fields);

    return (this.body = JSON.stringify(data, null, 2));
  })
  .get('/poll/:poll/results', isAdmin, function* getPollResults() {
    const results = yield this.poll.generateResults();

    yield this.render('admin-results', {
      title: `${this.i18n.__('Results')} - ${this.poll.slug}`,
      poll: this.poll,
      results
    });
  })
  .get('/poll/:poll/export/results', isAdmin, function* getExportedResults() {
    return (this.body = JSON.stringify(yield this.poll.generateResults(), null, 2));
  })
  .get('/users', isAdmin, function* getUsers() {
    yield this.render('admin-users', {
      title: this.i18n.__('Users')
    });
  })
  .get('/change-password', isAdmin, function* getChangePassword() {
    yield this.render('admin-change-password', {
      title: this.i18n.__('Change Password')
    });
  })
  .post('/change-password', isAdmin, bodyParser(), function* postChangePassword() {
    const body = this.request.body;

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

    const success = yield this.req.user.verifyPassword(body.currPassword);

    if (!success) {
      return yield this.render('admin-change-password', {
        title: this.i18n.__('Change Password'),
        error: 'Incorrect password.'
      });
    }

    const user = yield this.req.user.updatePassword(body.password);

    yield user.save();
    this.req.user = user;

    return yield this.render('admin-change-password', {
      title: this.i18n.__('Change Password'),
      success: 'Password successfully updated.'
    });
  })
  .get('/change-language', isAdmin, function* getChangeLanguage() {
    return yield this.render('admin-change-language', {
      title: this.i18n.__('Change Language'),
      locales: config.locales
    });
  })
  .post('/change-language', isAdmin, bodyParser(),
  function* postChangeLanguage() {
    const locale = this.request.body.fields.locale;

    yield models.User.update(this.req.user, {
      $set: { 'data.locale': locale }
    }).exec();

    return yield this.render('admin-change-language', {
      title: this.i18n.__('Change Language'),
      locales: config.locales
    });
  })
  .get('/*', isAdmin);

router.prefix('/admin');

module.exports = router;
