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
 */
'use strict';

const TAG = 'oyster/controllers/poll';

const co = require('co'),
      uuid = require('node-uuid'),
      provider = require('../provider'),
      mongoose = require('mongoose'),
      config = provider.config,
      schedule = provider.schedule,
      counters = require('../counters'),
      Log = require('huggare');

class PollController {
  static startScheduler() {
    return new Promise((resolve, reject) => {
      const stream = mongoose.model('Poll').find({ results: { $exists: false } }).stream();

      stream.on('data', doc => {
        new PollController(doc).schedule();
      })
      .on('error', reject)
      .on('close', resolve);
    });
  }

  constructor(model) {
    this.model = model;
  }

  saveResults() {
    return co(function* co$saveResults() {
      const model = this.model;

      if (model.results) {
        throw new Error('This poll already has results.');
      }

      const results = yield this.generateResults();

      model.set('results', results);
      yield model.save();

      Log.i(TAG, `Saved results for '${model.slug}'.`);

      return this.results;
    }.bind(this));
  }

  preparePollData() {
    const motions = [];
    const elections = [];

    for (const section of this.model.content.sections) {
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
  }

  generateResults() {
    return co(function* co$generateResults() {
      const beginGen = new Date();

      const pollData = this.preparePollData();

      const c = {};

      // Create counters for all motions
      for (const motion of pollData.motions) {
        c[motion.id] = new counters.MotionCounter(
          motion.id, motion.threshold);
      }

      for (const election of pollData.elections) {
        // Handle candidates now having info props
        election.candidates = election.candidates.map(cand => {
          return typeof cand === 'string' ? cand : cand.name;
        });

        c[election.id] = counters.createElectionCounter(election);
      }

      // Count errthang
      const pending = new Set(Object.keys(c));

      const model = this.model;

      while (pending.size) {
        yield model.model('Ballot').eachForSlug(model.slug, ballot => { //eslint-disable-line
          if (ballot.data.motions) {
            for (const m of pollData.motions) {
              c[m.id].insert(ballot.data.motions[m.id]);
            }
          }

          if (ballot.data.elections) {
            for (const e of pollData.elections) {
              c[e.id].insert(ballot.data.elections[e.id]);
            }
          }
        });

        for (const k in c) {
          if (!pending.has(k)) {
            continue;
          }

          const counter = c[k];

          if (typeof counter.tally === 'function') {
            counter.tally();
          }

          if (typeof counter.isDone !== 'function' || counter.isDone()) {
            pending.delete(k);
          }
        }
      }

      // Output the objects
      const results = {
        motions: [],
        elections: []
      };

      for (const m of pollData.motions) {
        results.motions.push(c[m.id].toObject());
      }

      for (const e of pollData.elections) {
        results.elections.push(c[e.id].toObject());
      }

      const endGen = new Date();

      results.ts = { start: beginGen, finish: endGen };

      return results;
    }.bind(this));
  }

  sendEmails() {
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
        for (const p of pg.participants) {
          const addr = p.email;

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
    }.bind(this.model));
  }

  cancelSchedule() {
    const model = this.model,
          jobStartName = `start:${model.slug}`,
          jobEndName = `end:${model.slug}`;

    schedule.cancelJob(jobStartName);
    schedule.cancelJob(jobEndName);
  }

  schedule() {
    const self = this,
          model = this.model,
          jobStartName = `start:${model.slug}`,
          jobEndName = `end:${model.slug}`;

    this.cancelSchedule();

    const now = Date.now();

    if (model.startTime) {
      // Don't bother if already ended.
      if (!(model.endTime && +model.endTime < now)) {
        schedule.scheduleJob(jobStartName, model.startTime, function* job() {
          Log.i(TAG, `Starting job: ${this.name}`);
          try {
            yield self.sendEmails();
          } catch (err) {
            Log.e(TAG, `Failed to send emails for '${model.slug}'.`, err);
          }
          Log.i(TAG, `Finished job: ${this.name}`);
        });

        Log.i(TAG, `Scheduled start of '${model.slug}' for ${model.startTime.toISOString()}`);
      }
    }

    if (model.endTime && !model.results) {
      schedule.scheduleJob(jobEndName, model.endTime, function* job() {
        Log.i(TAG, `Starting job: ${this.name}`);
        try {
          yield self.saveResults();
        } catch (err) {
          Log.e(TAG, `Failed to calculate results for '${model.slug}'.`, err);
        }
        Log.i(TAG, `Finished job: ${this.name}`);
      });

      Log.i(TAG, `Scheduled end of '${model.slug}' for ${model.endTime.toISOString()}`);
    }
  }
}

module.exports = PollController;
