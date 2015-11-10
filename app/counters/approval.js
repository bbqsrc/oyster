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

const RangeElection = require('./range');

class ApprovalElection extends RangeElection {
  constructor(id, candidates, opts) {
    opts.min = 0;
    opts.max = 1;
    opts.threshold = opts.threshold || 'none';

    super(id, candidates, opts);
  }

  calculateThreshold() {
    let method;

    if (this.threshold === 'majority') {
      method = c => {
        const p = (this.total / 2 | 0) + 1;

        return this.scores[c] >= p;
      };
    } else if (this.threshold === 'none') {
      method = () => true;
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

module.exports = ApprovalElection;
