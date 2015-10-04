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
'use strict'; /* eslint-disable no-unused-vars */

const nodemailer = require('nodemailer');

module.exports.createTransport = function createTransport(transporter) {
  const transport = nodemailer.createTransport.apply(nodemailer, arguments);

  const _sendMail = transport.sendMail.bind(transport);

  transport.sendMail = function sendMail(data) {
    return new Promise((resolve, reject) => {
      _sendMail(data, (err, info) => {
        if (err) {
          return reject(err);
        }

        return resolve(info);
      });
    });
  };

  return transport;
};
