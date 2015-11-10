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

class RangeElection {
  constructor(id, candidates, opts) {
    this.id = id;
    this.candidates = candidates;

    this.minScore = opts.min || 0;
    this.maxScore = opts.max || 9;
    this.winners = opts.winners || 1;
    this.invalids = 0;
    this.total = 0;
    this.threshold = opts.threshold;

    this.scores = {};
    for (const c of candidates) {
      this.scores[c] = 0;
    }
  }

  /* eslint-disable complexity */
  parse(ballot) {
    const clean = {};

    for (const c of this.candidates) {
      let v = ballot[c];

      if (!/^\s*[0-9]+\s*$/.test(v)) {
        return null;
      }

      v = v.trim();
      if (v === '') {
        v = 0;
      } else {
        v = parseInt(v, 10);
      }

      if (Number.isNaN(v) || v < this.minScore || v > this.maxScore) {
        return null;
      }

      clean[c] = v;
    }

    return clean;
  }
  /* eslint-enable complexity */

  insert(unparsedBallot) {
    const ballot = this.parse(unparsedBallot);

    if (ballot == null) {
      this.invalids++;
      return null;
    }

    this.total++;

    for (const c of this.candidates) {
      this.scores[c] += ballot[c];
    }

    return ballot;
  }

  determineWinners() {
    const rankList = [];

    for (const cand of this.candidates) {
      rankList.push([this.scores[cand], cand]);
    }
    rankList.sort();

    const order = [];

    while (rankList.length) {
      order.push(rankList.pop()[1]);
    }

    return order;
  }

  toObject() {
    return {
      id: this.id,
      method: 'range',
      threshold: this.threshold,
      candidates: this.candidates,
      winners: this.winners,
      data: {
        total: this.total,
        invalids: this.invalids,
        minScore: this.minScore,
        maxScore: this.maxScore,
        scores: this.scores
      },
      order: this.determineWinners()
    };
  }
}

module.exports = RangeElection;
