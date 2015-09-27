'use strict';
/* globals mongoose,browser,expect */

function login(b) {
  return b
    .setValue('#username', 'test')
    .setValue('#password', 'test')
    .click('.btn-primary');
}

function* checkRoute(b, u, t) {
  const title = yield b.getTitle();
  const url = yield b.url();

  expect(url.value).to.match(new RegExp(u));
  expect(title).to.equal(t);
}

describe('Oyster', function() {
  this.timeout(30000);

  before(function*() {
    yield mongoose.model('User').remove({username: 'test'});
    yield mongoose.model('User').createUser('test', 'test', {
      flags: ['admin', 'superadmin']
    });
  });

  describe('Home page', function() {
    it('should load', function*() {
      yield browser.url('/');
      expect(yield browser.getTitle())
             .to.equal('Index | Oyster');
    });

    it('should let us click "Admin"', function*() {
      yield* checkRoute(browser.click('.btn-link'),
                        '/admin/login',
                        'Log in | Oyster');
    });
  });

  describe('Log in page', function() {
    it('should let us log in', function*() {
      yield login(browser.url('/admin/login'));
      yield* checkRoute(browser, '/admin$', 'Index | Oyster');
    });
  });

  describe('Admin dashboard', function() {
    it('should let us navigate to New Poll page', function*() {
      yield browser
        .url('/admin')
        .click('#btn-new-poll');

      yield* checkRoute(browser, '/admin/polls/new$', 'New Poll | Oyster');
    });

    xit('should let us navigate to All Polls', function() {

    });

    xit('should let us navigate to Participants', function() {

    });

    it('should let us open the user dropdown', function*() {
      yield browser
        .url('/admin')
        .click('#btn-dropdown-user')
        .waitForVisible('#dropdown-user .dropdown-header');
    });

    describe('User dropdown', function() {
      beforeEach(function*() {
        yield browser
          .url('/admin')
          .click('#btn-dropdown-user')
          .waitForVisible('#dropdown-user .dropdown-header');
      });

      it('should show the currently logged in user', function*() {
        let text = yield browser.getText('#dropdown-user .dropdown-header');
        expect(text).to.equal('Logged in as test');
      });

      it('should let us navigate to change password page', function*() {
        yield* checkRoute(browser.click('#btn-change-password'),
                          '/admin/change-password$',
                          'Change Password | Oyster');
      });

      it('should let us navigate to change language page', function*() {
        yield* checkRoute(browser.click('#btn-change-language'),
                          '/admin/change-language$',
                          'Change Language | Oyster');
      });

      it('should let us log out', function*() {
        yield browser
          .click('#btn-logout')
          .url('/admin');

        yield* checkRoute(browser,
                          '/admin/login\?r=%2Fadmin$',
                          'Log in | Oyster');

        yield login(browser);
      });
    });
  });
});
