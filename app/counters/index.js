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

const RangeElection = require('./range'),
      ApprovalElection = require('./approval'),
      SchulzeElection = require('./schulze');

const map = {
  range: RangeElection,
  approval: ApprovalElection,
  schulze: SchulzeElection
};

// TODO: maybe we could add a "registerElectionMethod" method to the provider?
function createElectionCounter(obj) {
  const id = obj.id,
        method = obj.method,
        candidates = obj.candidates,
        winners = obj.winners;

  if (!map[method]) {
    throw new TypeError(`Method '${method}' is not supported.`);
  }

  return new map[method](id, candidates, { winners });
}

exports.createElectionCounter = createElectionCounter;
exports.MotionCounter = require('./motion');
