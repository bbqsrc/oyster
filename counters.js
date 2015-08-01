"use strict";

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
    if (v === "aye" ||
        v === "nay" ||
        v === "abstain") {
      this.c[v]++;
    } else {
      this.c.invalid++;
    }
  }

  toObject() {
    // TODO dehardcode
    let total = this.c.aye + this.c.nay;
    let p, s, pc;

    if (this.threshold === "two-thirds") {
      p = total / 3 * 2 | 0 + 1;
      s = this.c.aye >= p;
      pc = (this.c.aye / total * 100).toFixed(2) + "%";
    } else { // simple majority
      p = total / 2 | 0 + 1;
      s = this.c.aye >= p;
      pc = (this.c.aye / total * 100).toFixed(2) + "%";
    }

    return {
      id: this.id,
      threshold: this.threshold,
      counts: this.c,
      result: {
        percentage: pc,
        success: s
      }
    }
  }
}
exports.MotionCounter = MotionCounter;

class SchulzeElection {
  constructor(id, candidates, winners) {
    this.id = id;
    this.candidates = candidates;
    this.winners = winners;

    this._scores = createScoreMatrix(candidates.length);
  }

  parse(ballot) {
    let clean = {};

    for (let c of this.candidates) {
      let v = ballot[c];

      if (!/^\s*(?:(?!0+$)[0-9]+)?\s*$/.test(v)) {
        return null;
      }

      if (v.trim() === "") {
        v = Number.MAX_SAFE_INTEGER;
      } else {
        v = parseInt(v.trim(), 10);
        if (v <= 0 || v !== v) {
          return null;
        }
      }

      clean[c] = v;
    }

    return clean;
  }

  insert(ballot) {
    ballot = this.parse(ballot);
    let len = this.candidates.length;

    if (ballot === null) {
      // TODO record invalid ballots?
      return;
    }

    for (let i = 0; i < len; ++i) {
      let candI = this.candidates[i];

      for (let j = 0; j < len; ++j) {
        if (i === j) {
          continue;
        }

        let candJ = this.candidates[j];

        if (ballot[candI] < ballot[candJ]) {
          this._scores[i][j]++;
        }
      }
    }
  }

  calculateStrongestPaths() {
    let len = this.candidates.length;
    let scores = this._scores;
    let paths = createScoreMatrix(len);

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

  determineRankings(paths) {
    let len = this.candidates.length;
    let ranks = [];

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

    let o = {};

    for (let i = 0; i < len; ++i) {
      o[this.candidates[i]] = ranks[i];
    }

    return o;
  }

  determineOrder(ranks) {
    let rankList = [];
    for (let cand in ranks) {
      rankList.push([ranks[cand], cand]);
    }
    rankList.sort();

    let order = [];

    while (rankList.length) {
      order.push(rankList.pop()[1]);
    }

    return order;
  }

  toObject() {
    let paths = this.calculateStrongestPaths();
    let ranks = this.determineRankings(paths);
    // TODO break ties.
    let order = this.determineOrder(ranks);

    return {
      id: this.id,
      method: "schulze",
      candidates: this.candidates,
      winners: this.winners,
      data: {
        scores: this._scores,
        paths: paths,
        ranks: ranks
      },
      order: order
    }
  }
}
exports.SchulzeElection = SchulzeElection;

function createScoreMatrix(size) {
  let x = [];

  for (let i = 0; i < size; ++i) {
    let y = [];
    for (let j = 0; j < size; ++j) {
      y.push(0);
    }
    x.push(y);
  }

  return x;
}

function createElectionCounter(id, method, candidates, winners) {
  // TODO bad hardcoding, bad!

  if (method === "schulze") {
    return new SchulzeElection(id, candidates, winners);
  }

  throw new Error('unfinished method, oh yes!');
}
exports.createElectionCounter = createElectionCounter;
