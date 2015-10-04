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

const TAG = 'oyster/models/poll';

const mongoose = require('mongoose'),
      moment = require('moment'),
      uuid = require('node-uuid'),
      Schedule = require('node-schedule'),
      co = require('co'),
      config = require('../config'),
      counters = require('../counters'),
      Schema = mongoose.Schema,
      tomlify = require('tomlify-j0.4'),
      Log = require('huggare');

const pollSchema = new Schema({
  slug: { type: String, unique: true },
  title: String,
  isPublic: { type: Boolean, default: true },
  participantGroups: Array,
  emailsSent: { type: Array, default: [] },
  email: {
    from: String,
    subject: String,
    content: String
  },
  startTime: Date,
  endTime: Date,
  content: Schema.Types.Mixed,
  results: Schema.Types.Mixed,
  theme: String
});

pollSchema.statics.createPoll = function createPoll(o) {
  return co(function* co$createPoll() {
    const dateFormat = 'YYYY-MM-DDhh:mmZ',
          timezone = (parseInt(o.timezone, 10) >= 0 ? '+' : '-') + o.timezone,
          startTime = moment(o.startDate + o.startTime +
                             timezone, dateFormat).toDate(),
          endTime = moment(o.endDate + o.endTime +
                           timezone, dateFormat).toDate(),
          pollData = JSON.parse(o.pollData);

    let participants = o.participants;

    if (typeof participants === 'string') {
      participants = [participants];
    }

    const poll = new (this.model('Poll'))({
      slug: o.slug,
      title: o.title,
      isPublic: o.isPublic === 'on',
      participantGroups: participants,
      email: {
        from: o.emailFrom,
        subject: o.emailSubject,
        content: o.emailBody
      },
      startTime,
      endTime,
      content: pollData,
      theme: o.theme
    });

    yield poll.save();

    poll.schedule();

    return poll;
  }.bind(this));
};

pollSchema.statics.findBySlug = function findBySlug(slug) {
  return this.findOne({ slug }).exec();
};

pollSchema.statics.startScheduler = function startScheduler() {
  return new Promise((resolve, reject) => {
    const stream = this.find({ results: { $exists: false } }).stream();

    stream.on('data', doc => {
      doc.schedule();
    })
    .on('error', reject)
    .on('close', resolve);
  });
};

pollSchema.methods.cancelSchedule = function cancelSchedule() {
  const jobStartName = `start:${this.slug}`,
        jobEndName = `end:${this.slug}`;

  Schedule.cancelJob(jobStartName);
  Schedule.cancelJob(jobEndName);
};

pollSchema.methods.schedule = function schedule() {
  const self = this,
        jobStartName = `start:${this.slug}`,
        jobEndName = `end:${this.slug}`;

  this.cancelSchedule();

  const now = Date.now();

  if (this.startTime) {
    // Don't bother if already ended.
    if (!(this.endTime && +this.endTime < now)) {
      Schedule.scheduleJob(jobStartName, this.startTime, function job() {
        co(function* co$job() {
          Log.i(TAG, `Starting job: ${this.name}`);
          yield self.sendEmails();
          Log.i(TAG, `Finished job: ${this.name}`);
        }.bind(this)).catch(err => {
          Log.e(TAG, `Failed to send emails for '${self.slug}'.`, err);
        });
      });

      Log.i(TAG, `Scheduled start of '${this.slug}' for ${this.startTime.toISOString()}`);
    }
  }

  if (this.endTime && !this.results) {
    Schedule.scheduleJob(jobEndName, this.endTime, function job() {
      co(function* co$job() {
        Log.i(TAG, `Starting job: ${this.name}`);
        yield self.saveResults();
        Log.i(TAG, `Finished job: ${this.name}`);
      }.bind(this)).catch(err => {
        Log.e(TAG, `Failed to send emails for '${self.slug}'.`, err);
      });
    });

    Log.i(TAG, `Scheduled end of '${this.slug}' for ${this.endTime.toISOString()}`);
  }
};

pollSchema.methods.sendEmails = function sendEmails() {
  return co(function* co$sendEmails() {
    const pgs = yield this.model('ParticipantGroup').find({
      name: { $in: this.participantGroups }
    }).exec();

    if (pgs.length !== this.participantGroups.length) {
      throw new Error('Incorrect number of participant groups returned.');
    }

    const baseUrl = config.host;
    const mailer = config.createMailer();

    for (const pg of pgs) {
      for (const addr of pg.emails) {
        if (this.emailsSent.indexOf(addr) > -1) {
          continue;
        }

        const token = uuid.v4().replace(/-/g, '');

        const ballot = new (this.model('Ballot'))({
          token,
          poll: this.slug,
          flags: pg.flags
        });

        const url = `https://${baseUrl}/poll/${this.slug}/${token}`;
        const text = this.email.content.replace('{url}', url);

        yield mailer.sendMail({
          from: this.email.from,
          to: addr,
          subject: this.email.subject,
          text
        });

        this.emailsSent.push(addr);
        this.markModified('emailsSent');

        yield this.save();
        yield ballot.save();
      }
    }
  }.bind(this));
};

pollSchema.methods.preparePollData = function preparePollData() {
  const motions = [];
  const elections = [];

  for (const section of this.content.sections) {
    const type = section.type;

    if (type === 'motion') {
      const thresholdType = section.threshold || 'majority';

      for (const field of section.fields) {
        motions.push({
          id: field.id,
          threshold: thresholdType
        });
      }
    } else if (type === 'election') {
      const method = section.method || 'schulze';
      let winners = section.winners || 1;

      for (const field of section.fields) {
        winners = field.winners || winners;

        elections.push({
          id: field.id,
          candidates: field.candidates,
          winners,
          method
        });
      }
    }
  }

  return { elections, motions };
};

pollSchema.methods.generateResults = function generateResults() {
  return co(function* co$generateResults() {
    const beginGen = new Date();

    const pollData = this.preparePollData();

    const mCounters = {};
    const eCounters = {};

    // Create counters for all motions
    for (const motion of pollData.motions) {
      mCounters[motion.id] = new counters.MotionCounter(
        motion.id, motion.threshold);
    }

    for (const election of pollData.elections) {
      eCounters[election.id] = counters.createElectionCounter(
        election.id, election.method, election.candidates, election.winners);
    }

    // Count errthang
    yield this.model('Ballot').eachForSlug(this.slug, ballot => {
      if (ballot.data.motions) {
        for (const m of pollData.motions) {
          mCounters[m.id].insert(ballot.data.motions[m.id]);
        }
      }

      if (ballot.data.elections) {
        for (const e of pollData.elections) {
          eCounters[e.id].insert(ballot.data.elections[e.id]);
        }
      }
    });

    // Output the objects
    const results = {
      motions: [],
      elections: []
    };

    for (const id in mCounters) {
      results.motions.push(mCounters[id].toObject());
    }

    for (const id in eCounters) {
      results.elections.push(eCounters[id].toObject());
    }

    const endGen = new Date();

    results.ts = { start: beginGen, finish: endGen };

    return results;
  }.bind(this));
};

pollSchema.methods.saveResults = function saveResults() {
  return co(function* co$saveResults() {
    if (this.results) {
      throw new Error('This poll already has results.');
    }

    const results = yield this.generateResults();

    this.set('results', results);
    yield this.save();

    Log.i(TAG, `Saved results for '${this.slug}'.`);

    return this.results;
  }.bind(this));
};

pollSchema.methods.isEditable = function isEditable() {
  return +this.startTime > Date.now();
};

// TODO: ...
const util = require('../util');

pollSchema.methods.contentAsTOML = function contentAsTOML() {
  return tomlify(util.reverseObject(this.content), (key, value) => {
    if (key === 'info' || key === 'body') {
      return `"""\n${value.trim()}\n"""`;
    }
    return false;
  }, 0);
};

module.exports = mongoose.model('Poll', pollSchema);
