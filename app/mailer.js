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
