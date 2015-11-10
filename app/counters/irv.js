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

const util = require('./util');

function firstValidCandidate(ballot, candidates) {
  for (const cand of ballot) {
    if (candidates.indexOf(cand) > -1) {
      return cand;
    }
  }

  return null;
}

class IRVRound {
  constructor(candidates) {
    this.candidates = candidates;
    this.count = new util.Counter(candidates);
  }

  insert(ballot) {
    const c = firstValidCandidate(ballot, this.candidates);

    if (c) {
      this.count.inc(c);
    }
  }

  hasWinner() {
    const target = util.majorityQuota(this.count.total);
    const first = this.count.first();

    return first[0] >= target;
  }

  winner() {
    return this.count.first()[1];
  }

  eliminate() {
    return this.count.last()[1];
  }

  toObject() {
    const o = {
      total: this.count.total,
      tally: this.count.ordered()
    };

    if (this.hasWinner()) {
      o.winner = this.winner();
    } else {
      o.eliminated = this.eliminate();
    }

    return o;
  }
}

class IRVElection {
  constructor(id, candidates, opts) {
    this.id = id;
    this.candidates = candidates;
    this.remaining = candidates.slice();

    this.currentRound = new IRVRound(candidates);
    this.options = opts || {};

    this.rounds = [];
    this.invalids = 0;
  }

  parse(ballot) {
    const clean = [];
    let skipped = 0;

    for (const c of this.candidates) {
      const v = util.validRankOrNull(ballot[c], 1, this.candidates.length);

      if (v == null) {
        if (!this.options.optional) {
          return null;
        } else {
          skipped++;
        }
      }

      // Dupe!
      if (clean[v]) {
        return null;
      }

      clean[v] = c;
    }

    if ((clean.filter(Boolean).length + skipped) !== this.candidates.length) {
      return null;
    }

    return clean;
  }

  insert(b) {
    const ballot = this.parse(b);

    if (ballot == null) {
      this.invalids++;
      return;
    }

    this.currentRound.insert(ballot);
  }

  tally() {
    if (!this.currentRound) {
      throw new TypeError('Election has already finished being counted.');
    }

    this.rounds.push(this.currentRound);

    if (!this.currentRound.hasWinner()) {
      util.arrayRemove(this.remaining, this.currentRound.eliminate());
      this.currentRound = new IRVRound(this.remaining);
    } else {
      this.currentRound = null;
    }
  }

  get lastRound() {
    const i = this.rounds.length - 1;

    return i > -1 ? this.rounds[i] : null;
  }

  isDone() {
    return this.lastRound.hasWinner();
  }

  toObject() {
    const rounds = this.rounds.map(r => r.toObject());

    return {
      id: this.id,
      method: 'irv',
      candidates: this.candidates,
      winners: [this.lastRound.winner()],
      data: {
        invalids: this.invalids,
        rounds
      }
    };
  }
}

module.exports = IRVElection;
