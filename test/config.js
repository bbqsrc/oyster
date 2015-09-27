const _ = require('lodash');

module.exports = function makeConfig(o) {
  return Object.freeze(_.defaults({}, o, {
    host: 'localhost',
    port: 3000,

    mongoHost: 'localhost',
    mongoPort: 27017,
    mongoDB: 'oysterTest',
    mongoUsername: null,
    mongoPassword: null,

    locales: ['en'],

    mailerTransport: function(x) { //eslint-disable-line
      return {
        send: function(x, cb){ cb() } //eslint-disable-line
      };
    },
    mailerConfig: {},

    logPath: './test-server.log',

    cookieSecret: 'test secret',
    cookieName: 'oyster.id',
    cookieMaxAge: 900000,

    get mongoURL() {
      return 'mongodb://' + this.mongoHost + ':' + this.mongoPort + '/' + this.mongoDB;
    },

    createMailer: function() {
      return; // Stubbed
    }
  }));
};
