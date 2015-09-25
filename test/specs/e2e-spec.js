'use strict';

describe('Oyster', function() {
  this.timeout(10000);

  describe('Admin page', function() {
    it('should require logging in', function*() {
      let title = yield browser
        .url('http://localhost:3000/admin')
        .getTitle();
      expect(title).to.equal('Log in| Oyster');
    });
  });
});
