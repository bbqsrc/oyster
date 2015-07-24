"use strict";

var nodemailer = require('nodemailer');

module.exports.createTransport = function(transporter) {
  let transport = nodemailer.createTransport.apply(this, arguments);

  let sendMail = transport.sendMail;

  transport.sendMail = function sendMail(data) {
    return new Promise(function(resolve, reject) {
      sendMail(data, function(err, info) {
        if (err) {
          return reject(err)
        };

        return resolve(info);
      });
    });
  }

  return transport;
};

