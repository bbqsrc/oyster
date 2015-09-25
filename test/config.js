module.exports = Object.freeze({
  production: false,
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

  logPath: null,

  cookieSecret: 'test secret',
  cookieName: 'oyster.id',
  cookieMaxAge: 900000,

  get mongoURL() {
    return 'mongodb://' + this.mongoHost + ':' + this.mongoPort + '/' + this.mongoDB;
  },

  createMailer: function() {
    return; // Stubbed
  }
});
