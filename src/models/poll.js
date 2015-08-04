'use strict';

var mongoose = require('mongoose'),
    moment = require('moment'),
    uuid = require('node-uuid'),
    schedule = require('node-schedule'),
    co = require('co'),
    config = require('../config'),
    counters = require('../counters'),
    Schema = mongoose.Schema,
    Log = require('huggare');

var TAG = 'oyster/models/poll';

var pollSchema = new Schema({
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
  results: Schema.Types.Mixed
});

pollSchema.statics.createPoll = function(o) {
  return co(function*() {
    let dateFormat = 'YYYY-MM-DDhh:mmZ',
        timezone = (parseInt(o.timezone, 10) >= 0 ? '+' : '-') + o.timezone,
        startTime = moment(o.startDate + o.startTime +
                           timezone, dateFormat).toDate(),
        endTime = moment(o.endDate + o.endTime +
                         timezone, dateFormat).toDate(),
        participants = o.participants,
        pollData = JSON.parse(o.pollData);

    if (typeof participants === 'string') {
      participants = [participants];
    }

    let poll = new (this.model('Poll'))({
      slug: o.slug,
      title: o.title,
      isPublic: o.isPublic === 'on',
      participantGroups: participants,
      email: {
        from: o.emailFrom,
        subject: o.emailSubject,
        content: o.emailBody
      },
      startTime: startTime,
      endTime: endTime,
      content: pollData
    });

    yield poll.save();

    poll.schedule();

    return poll;
  }.bind(this));
};

pollSchema.statics.findBySlug = /* async */ function(slug) {
  return this.findOne({ slug: slug }).exec();
};

pollSchema.methods.schedule = function() {
  let doc = this;

  let jobStartName = 'start:' + doc.slug,
      jobEndName = 'end:' + doc.slug;

  schedule.cancelJob(jobStartName);
  schedule.cancelJob(jobEndName);

  let now = Date.now();

  if (doc.startTime) {
    // Don't bother if already ended.
    if (!(doc.endTime && +doc.endTime < now)) {
      schedule.scheduleJob(jobStartName, doc.startTime, function() {
        co(function* () {
          Log.i(TAG, 'Starting job: ' + this.name);
          yield doc.sendEmails();
          Log.i(TAG, 'Finished job: ' + this.name);
        }.bind(this)).catch(function(e) {
          Log.e(TAG, "Failed to send emails for '" + doc.slug + "'.", e);
        });
      });

      Log.i(TAG, "Scheduled start of '" + doc.slug +  "' for " + doc.startTime.toISOString());
    }
  }

  if (doc.endTime && !doc.results) {
    schedule.scheduleJob(jobEndName, doc.endTime, function() {
      co(function* () {
        Log.i(TAG, 'Starting job: ' + this.name);
        yield doc.saveResults();
        Log.i(TAG, 'Finished job: ' + this.name);
      }.bind(this)).catch(function(e) {
        Log.e(TAG, "Failed to save results for '" + doc.slug + "'.", e);
      });
    });

    Log.i(TAG, "Scheduled end of '" + doc.slug +  "' for " + doc.endTime.toISOString());
  }
};

pollSchema.methods.sendEmails = function() {
  let self = this;

  return co(function*() {
    let pgs = yield self.model('ParticipantGroup').find({
      name: { $in : self.participantGroups }
    }).exec();

    if (pgs.length !== self.participantGroups.length) {
      throw new Error('Incorrect number of participant groups returned.');
    }

    let baseUrl = config.host;
    let mailer = config.createMailer();

    for (let pg of pgs) {
      for (let email of pg.emails) {
        if (self.emailsSent.indexOf(email) > -1) {
          continue;
        }

        let token = uuid.v4().replace(/-/g, '');

        let ballot = new (self.model('Ballot'))({
          token: token,
          poll: self.slug,
          flags: pg.flags
        });

        let url = 'https://' + baseUrl + '/poll/' + self.slug + '/' + token;
        let text = self.email.content.replace('{url}', url);

        yield mailer.sendMail({
          from: self.email.from,
          to: email,
          subject: self.email.subject,
          text: text
        });

        self.emailsSent.push(email);
        self.markModified('emailsSent');
        yield self.save();
        yield ballot.save();
      }
    }
  });
};

pollSchema.methods.preparePollData = function() {
  let doc = this;

  let content = doc.content;

  let motions = [];
  let elections = [];

  for (let section of content.sections) {
    let type = section.type;

    if (type === 'motion') {
      let thresholdType = section.threshold || 'majority';

      for (let field of section.fields) {
        motions.push({
          id: field.id,
          threshold: thresholdType
        });
      }
    } else if (type === 'election') {
      let method = section.method || 'schulze';
      let winners = section.winners || 1;

      for (let field of section.fields) {
        elections.push({
          id: field.id,
          candidates: field.candidates,
          winners: field.winners || winners,
          method: method
        });
      }
    }
  }

  return {
    elections: elections,
    motions: motions
  };
};

pollSchema.methods.generateResults = function() {
  return co(function*() {
    let beginGen = new Date;

    let pollData = this.preparePollData();

    let mCounters = {};
    let eCounters = {};

    // Create counters for all motions
    for (let motion of pollData.motions) {
      mCounters[motion.id] = new counters.MotionCounter(
        motion.id, motion.threshold);
    }

    for (let election of pollData.elections) {
      eCounters[election.id] = counters.createElectionCounter(
        election.id, election.method, election.candidates, election.winners);
    }

    // Count errthang
    yield this.model('Ballot').eachForSlug(this.slug, function(ballot) {
      if (ballot.data.motions) {
        for (let m of pollData.motions) {
          mCounters[m.id].insert(ballot.data.motions[m.id]);
        }
      }

      if (ballot.data.elections) {
        for (let e of pollData.elections) {
          eCounters[e.id].insert(ballot.data.elections[e.id]);
        }
      }
    });

    // Output the objects
    let results = {
      motions: [],
      elections: []
    };

    for (let id in mCounters) {
      results.motions.push(mCounters[id].toObject());
    }

    for (let id in eCounters) {
      results.elections.push(eCounters[id].toObject());
    }

    let endGen = new Date;

    results.ts = { start: beginGen, finish: endGen };

    return results;
  }.bind(this));
};

pollSchema.methods.saveResults = function() {
  return co(function*() {
    if (this.results) {
      throw new Error('This poll already has results.');
    }

    let results = yield this.generateResults();
    this.set('results', results);
    yield this.save();

    Log.i(TAG, "Saved results for '" + this.slug + "'.");

    return this.results;
  }.bind(this));
};

pollSchema.methods.isEditable = function() {
  return +this.startTime > Date.now();
};

pollSchema.statics.startScheduler = function() {
  return new Promise(function(resolve, reject) {
    let stream = this.find({ results: { $exists: false } }).stream();

    stream.on('data', function(doc) {
      doc.schedule();
    })
    .on('error', reject)
    .on('close', function() {
      resolve();
    });
  }.bind(this));
};

module.exports = mongoose.model('Poll', pollSchema);
