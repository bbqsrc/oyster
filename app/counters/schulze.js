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

function createScoreMatrix(size) {
  const x = [];

  for (let i = 0; i < size; ++i) {
    const y = [];

    for (let j = 0; j < size; ++j) {
      y.push(0);
    }

    x.push(y);
  }

  return x;
}

class SchulzeElection {
  constructor(id, candidates, opts) {
    this.id = id;
    this.candidates = candidates;
    this.winners = opts.winners || 1;

    this._scores = createScoreMatrix(candidates.length);
    this.invalids = 0;
  }

  parse(ballot) {
    const clean = {};

    for (const c of this.candidates) {
      let v = ballot[c];

      if (v.trim() === '') {
        v = Infinity;
      } else {
        v = util.validRankOrNull(v);

        // Short-circuit if null
        if (v == null) {
          return null;
        }
      }

      clean[c] = v;
    }

    return clean;
  }

  insert(unparsedBallot) {
    const ballot = this.parse(unparsedBallot);
    const len = this.candidates.length;

    if (ballot === null) {
      this.invalids++;
      return null;
    }

    for (let i = 0; i < len; ++i) {
      const candI = this.candidates[i];

      for (let j = 0; j < len; ++j) {
        if (i === j) {
          continue;
        }

        const candJ = this.candidates[j];

        if (ballot[candI] < ballot[candJ]) {
          this._scores[i][j]++;
        }
      }
    }

    return ballot;
  }

  /* eslint-disable complexity */
  calculateStrongestPaths() {
    const len = this.candidates.length;
    const scores = this._scores;
    const paths = createScoreMatrix(len);

    for (let i = 0; i < len; ++i) {
      for (let j = 0; j < len; ++j) {
        if (i === j) {
          continue;
        }

        if (scores[i][j] > scores[j][i]) {
          paths[i][j] = scores[i][j];
        }
      }
    }

    for (let i = 0; i < len; ++i) {
      for (let j = 0; j < len; ++j) {
        if (i === j) {
          continue;
        }

        for (let k = 0; k < len; ++k) {
          if (i !== k && j !== k) {
            paths[j][k] = Math.max(paths[j][k],
                                   Math.min(paths[j][i],
                                            paths[i][k]));
          }
        }
      }
    }

    return paths;
  }
  /* eslint-enable complexity */

  determineRankings(paths) {
    const len = this.candidates.length;
    const ranks = [];

    for (let i = 0; i < len; ++i) {
      ranks[i] = 0;

      for (let j = 0; j < len; ++j) {
        if (i === j) {
          continue;
        }

        if (paths[i][j] > paths[j][i]) {
          ranks[i]++;
        }
      }
    }

    const o = {};

    for (let i = 0; i < len; ++i) {
      o[this.candidates[i]] = ranks[i];
    }

    return o;
  }

  determineOrder(ranks) {
    const rankList = [];

    for (const cand in ranks) {
      rankList.push([ranks[cand], cand]);
    }

    return rankList.sort((a, b) => {
      return b[0] - a[0];
    }).map(x => {
      return x[1];
    });
  }

  toObject() {
    const paths = this.calculateStrongestPaths();
    const ranks = this.determineRankings(paths);
    // TODO break ties.
    const order = this.determineOrder(ranks);
    const orderedScores = SchulzeElection.reorderScores(
      this.candidates, order, this._scores);

    return {
      id: this.id,
      method: 'schulze',
      candidates: this.candidates,
      winners: this.winners,
      data: {
        invalids: this.invalids,
        scores: this._scores,
        paths,
        ranks,
        orderedScores
      },
      order
    };
  }

  static reorderScores(originalCands, newCands, scores) {
    const newOrder = [];

    for (const c of newCands) {
      newOrder.push(originalCands.indexOf(c));
    }

    const newScores = [];

    for (let i = 0; i < newOrder.length; ++i) {
      const newRow = [];
      const currRow = scores[newOrder[i]];

      for (let j = 0; j < newOrder.length; ++j) {
        newRow.push(currRow[newOrder[j]]);
      }

      newScores.push(newRow);
    }

    return newScores;
  }
}

module.exports = SchulzeElection;
