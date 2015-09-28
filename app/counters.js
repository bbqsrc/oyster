'use strict';

class MotionCounter {
  constructor(id, threshold) {
    this.id = id;
    this.threshold = threshold;
    this.c = {
      aye: 0,
      nay: 0,
      abstain: 0,
      invalid: 0
    };
  }

  insert(v) {
    if (v === 'aye' ||
        v === 'nay' ||
        v === 'abstain') {
      this.c[v]++;
      return v;
    } else {
      this.c.invalid++;
      return null;
    }
  }

  toObject() {
    // TODO dehardcode
    const total = this.c.aye + this.c.nay;
    let p, s, pc;

    if (this.threshold === 'two-thirds') {
      p = total / 3 * 2 | 0 + 1;
      s = this.c.aye >= p;
      pc = `${(this.c.aye / total * 100).toFixed(2)}%`;
    } else {
      // simple majority
      p = total / 2 | 0 + 1;
      s = this.c.aye >= p;
      pc = `${(this.c.aye / total * 100).toFixed(2)}%`;
    }

    return {
      id: this.id,
      threshold: this.threshold,
      counts: this.c,
      result: {
        percentage: pc,
        success: s
      }
    };
  }
}
exports.MotionCounter = MotionCounter;

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
exports.RangeElection = RangeElection;

class ApprovalElection extends RangeElection {
  constructor(id, candidates, opts) {
    opts.min = 0;
    opts.max = 1;
    opts.threshold = opts.threshold || 'majority';

    super(id, candidates, opts);
  }

  calculateThreshold() {
    let method;

    if (this.threshold === 'majority') {
      method = c => {
        const p = this.total / 2 | 0 + 1;

        return this.scores[c] >= p;
      };
    }

    const o = {};

    for (const c of this.candidates) {
      o[c] = method(c);
    }

    return o;
  }

  toObject() {
    const o = super.toObject();

    o.method = 'approval';
    delete o.data.minScore;
    delete o.data.maxScore;

    o.data.thresholdMet = this.calculateThreshold();

    return o;
  }
}
exports.ApprovalElection = ApprovalElection;

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

      if (!/^\s*(?:(?!0+$)[0-9]+)?\s*$/.test(v)) {
        return null;
      }

      if (v.trim() === '') {
        v = Number.MAX_SAFE_INTEGER;
      } else {
        v = parseInt(v.trim(), 10);
        if (v <= 0 || Number.isNaN(v)) {
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
exports.SchulzeElection = SchulzeElection;

function createElectionCounter(id, method, candidates, winners) {
  // TODO bad hardcoding, bad!

  if (method === 'schulze') {
    return new SchulzeElection(id, candidates, { winners });
  } else if (method === 'range') {
    return new RangeElection(id, candidates, { winners });
  } else if (method === 'approval') {
    return new ApprovalElection(id, candidates, { winners });
  }

  throw new Error('unfinished method, oh yes!');
}
exports.createElectionCounter = createElectionCounter;
