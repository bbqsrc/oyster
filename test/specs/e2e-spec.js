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
    describe('Navbar links', function() {
      afterEach(function*() {
        yield browser.url('/admin');
      });

      it('should let us navigate to New Poll page', function*() {
        yield* checkRoute(browser.click('#btn-new-poll'), '/admin/polls/new$', 'New Poll | Oyster');
      });

      it('should let us navigate to All Polls', function*() {
        yield* checkRoute(browser.click('#btn-all-polls'), '/admin/polls$', 'All Polls | Oyster');
      });

      it('should let us navigate to Participants', function*() {
        yield* checkRoute(browser.click('#btn-participants'), '/admin/participants$', 'Participants | Oyster');
      });
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
                          '/admin/login\\?r=%2Fadmin$',
                          'Log in | Oyster');

        expect((yield login(browser).url()).value).to.match(/\/admin$/);
      });
    });
  });

  describe('New poll page', function() {
    before(function*() {
      yield browser.url('/admin/polls/new').waitForExist('.btn-success');
    });

    function* existsSet(selector, value) {
      expect(yield browser.isExisting(selector)).to.be.true;
      yield browser.setValue(selector, value);
      expect(yield browser.getValue(selector)).to.equal(value);
    }

    function* existsDateTimeSet(selector, value) {
      // Chrome throws a fit on date fields for some reason.
      expect(yield browser.isExisting(selector)).to.be.true;

      yield browser.selectorExecute(selector, function(nodes, value) {
        return nodes[0].value = value;
      }, value);
      expect((yield browser.getValue(selector))).to.equal(value);
    }

    describe('Basic fields', function() {
      it('should have a poll name field and be editable', function*() {
        yield* existsSet('#fld1', 'Test Poll');
      });

      it('should have a slug field and be editable', function*() {
        yield* existsSet('#fld2', 'test-poll');
      });

      xit('should auto-populate the slug field', function*() {

      });

      it('should have a checkbox for making the poll public', function*() {
        expect(yield browser.isExisting('[name="isPublic"]')).to.be.true;
      });

      it('should have a start date field and be editable', function*() {
        yield* existsDateTimeSet('#startDate', '2015-01-01');
      });

      it('should have a start time field and be editable', function*() {
        yield* existsDateTimeSet('#startTime', '00:00');
      });

      it('should have an end date field and be editable', function*() {
        yield* existsDateTimeSet('#endDate', '2015-12-31');
      });

      it('should have an end time field and be editable', function*() {
        yield* existsDateTimeSet('#endTime', '23:59');
      });

      xit('should set the start date to today if you press the "Today" button', function*() {

      });

      it('should have a timezone field', function*() {
        yield browser.isExisting('#timezone');
        yield browser.isExisting('.timezone-human');
        expect(yield browser.getText('.timezone-human')).to.match(/^UTC/);
      });
    });

    describe('Poll data field', function() {
      xit('should be editable with a syntax highlighting editor', function*() {
        yield browser.isExisting('#poll-data-editor .ace_content');
      });

      xit('should validate the input for correctness', function*() {

      });
    });

    describe('Other poll data', function() {
      it('should have a theme dropdown', function*() {
        yield browser.isExisting('#theme');
      });

      xit('should have a participant groups multi-selection field', function*() {

      });
    });

    describe('Email fields', function() {
      it('from field should be a field and be editable', function*() {
        yield* existsSet('#fld-email1', 'Test (Place) <email@thing.lol>');
      });

      xit('from field should validate input for correctness', function*() {

      });

      it('should have an email subject field', function*() {
        yield* existsSet('#fld-email2', 'Subject goes here');
      });

      it('email body field should be a field and be editable', function*() {
        // Firefox: clears new lines at the end.
        yield* existsSet('#fld-email3', 'This is my email.\n\nIt might be common but it is mine. Click your URL.\n\n{url}');
      });

      xit('body field should validate input for a {url} string', function*() {

      });
    });

    describe('Create poll button', function() {
      xit('should be a button', function*() {

      });

      xit('should not allow submission if poll content is invalid', function*() {

      });

      xit('should not allow submission if email from field is invalid', function*() {

      });

      xit('should create a poll when clicked', function*() {

      });

      xit('should have redirected us to the poll page', function*() {

      });
    });
  });
});
