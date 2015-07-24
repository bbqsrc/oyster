"use strict";

var nodemailer = require('nodemailer');

module.exports.createTransport = function(transporter) {
  let transport = nodemailer.createTransport.apply(nodemailer, arguments);

  let _sendMail = transport.sendMail.bind(transport);

  transport.sendMail = function sendMail(data) {
    return new Promise(function(resolve, reject) {
      _sendMail(data, function(err, info) {
        if (err) {
          return reject(err)
        };

        return resolve(info);
      });
    });
  }

  return transport;
};

