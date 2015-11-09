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
      p = (total / 3 * 2 | 0) + 1;
      s = this.c.aye >= p;
      pc = `${(this.c.aye / total * 100).toFixed(2)}%`;
    } else {
      // simple majority
      p = (total / 2 | 0) + 1;
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
module.exports = MotionCounter;
