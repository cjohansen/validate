/*global describe, it, assert, beforeEach */
'use strict';

var rules = require('../').rules;
var enforceRules = rules.enforceRules;
var required = rules.required;
var pattern = rules.pattern;
var and = rules.and;
var or = rules.or;
var isVisible = rules.isVisible;
var exists = rules.exists;
var email = rules.email;
var minlength = rules.minlength;
var when = rules.when;

describe('required', function () {
  it('does not allow required fields to be blank', function () {
    var rule = required('name', 'Name cannot be blank');

    assert.equals(rule({}), {
      id: 'name',
      msg: 'Name cannot be blank'
    });
  });
});

describe('required', function () {
  it('does not allow required fields to be blank', function () {
    var rules = [required('name', 'Name cannot be blank')];

    assert.equals(enforceRules(rules, {}), [
      {id: 'name', messages: ['Name cannot be blank']}
    ]);
  });

  it('allows required fields to have content', function () {
    var rules = [required('name', 'Name cannot be blank')];

    assert.equals(enforceRules(rules, {name: 'My name is?'}), []);
  });
});

describe('pattern', function () {
  it('allows blank value', function () {
    var rules = [pattern('name', /\d/, 'Must match')];

    assert.equals(enforceRules(rules, {}), []);
  });

  it('allows matching value', function () {
    var rules = [pattern('name', /\w+/, 'Must match')];

    assert.equals(enforceRules(rules, {name: 'PERL'}), []);
  });

  it('non-matching values are disallowed', function () {
    var rules = [pattern('name', /[a-z]+/, 'Must match')];

    assert.equals(enforceRules(rules, { name: '17!' }), [{
      id: 'name',
      messages: ['Must match']
    }]);
  });

  it('supports nested names', function () {
    var rules = [pattern('name[given]', /[a-z]+/, 'Must match')];

    assert.equals(enforceRules(rules, { name: {given: '17!'} }), [{
      id: 'name[given]',
      messages: ['Must match']
    }]);
  });

});

describe('and', function () {
  var rules;

  beforeEach(function () {
    rules = [and(pattern('name', /\d/, 'Must numberize'),
                 pattern('name', /\s/, 'Must whitespacize'))];
  });

  it('fails on first broken rule', function () {
    assert.equals(enforceRules(rules, {name: 'A'}), [{
      id: 'name',
      messages: ['Must numberize']
    }]);
  });

  it('fails when second rule is broken', function () {
    assert.equals(enforceRules(rules, {name: '1'}), [{
      id: 'name',
      messages: ['Must whitespacize']
    }]);
  });

  it('passes when all rules are honored', function () {
    assert.equals(enforceRules(rules, {name: '1 1'}), []);
  });
});

describe('or', function () {
  var rules;

  beforeEach(function () {
    rules = [or(pattern('name', /\d/, 'Must numberize'),
                pattern('name', /\s/, 'Must whitespacize'))];
  });

  it('returns last error when all fail', function () {
    assert.equals(enforceRules(rules, {name: 'A'}), [{
      id: 'name',
      messages: ['Must whitespacize']
    }]);
  });

  it('passes when first rule is satisfied', function () {
    assert.equals(enforceRules(rules, {name: '1'}), []);
  });

  it('passes when second rule is satisfied', function () {
    assert.equals(enforceRules(rules, {name: ' '}), []);
  });
});

describe('isVisible', function () {
  var el, rules;

  beforeEach(function () {
    el = document.createElement('input');
    rules = [when(isVisible(el), required('something', 'Oh noes'))];
  });

  it('skips validation when field does not exist', function () {
    var rules = [when(isVisible(undefined), required('something', 'Oh noes'))];
    assert.equals(enforceRules(rules, {}), []);
  });

  it('skips validation when field is not visible', function () {
    assert.equals(enforceRules(rules, {}), []);
  });

  it('validates when field is visible', function () {
    document.body.appendChild(el);
    assert.equals(enforceRules(rules, {}), [{
      id: 'something',
      messages: ['Oh noes']
    }]);
  });

  it('passes valid visible field', function () {
    document.body.appendChild(el);
    assert.equals(enforceRules(rules, {something: 'OK'}), []);
  });
});

describe('exists', function () {
  var rules;

  beforeEach(function () {
    rules = [when(exists('optional-name'), required('name', 'Oh noes'))];
  });

  it('skips validation when field is not in the DOM', function () {
    assert.equals(enforceRules(rules, {}), []);
  });

  it('validates when field is in the DOM', function () {
    var el = document.createElement('div');
    el.id = 'optional-name';
    document.body.appendChild(el);
    assert.equals(enforceRules(rules, {}), [{
      id: 'name',
      messages: ['Oh noes']
    }]);
  });
});

describe('email', function () {
  var rules = [email('emailAddress', {
    missingAt: 'Missing @',
    missingUser: 'Missing user',
    missingDomain: 'Missing domain',
    missingTLD: 'Missing TLD',
    almostHotmail: 'Did you mean hotmail.com?',
    almostGmail: 'Did you mean gmail.com?'
  })];

  it('allows blank value', function () {
    assert.equals(enforceRules(rules, {}), []);
  });

  it('fails without an @', function () {
    assert.equals(enforceRules(rules, {emailAddress: 'john+doe.com'}), [{
      id: 'emailAddress',
      messages: ['Missing @']
    }]);
  });

  it('fails without text before @', function () {
    assert.equals(enforceRules(rules, {emailAddress: '@doe.com'}), [{
      id: 'emailAddress',
      messages: ['Missing user']
    }]);
  });

  it('fails without text after @', function () {
    assert.equals(enforceRules(rules, {emailAddress: 'john@'}), [{
      id: 'emailAddress',
      messages: ['Missing domain']
    }]);
  });

  it('fails without tld', function () {
    assert.equals(enforceRules(rules, {emailAddress: 'john@doe'}), [{
      id: 'emailAddress',
      messages: ['Missing TLD']
    }]);
  });

  it('fails with common errors', function () {
    assert.equals(enforceRules(rules, {emailAddress: 'john@hotmail.no'}), [{
      id: 'emailAddress',
      messages: ['Did you mean hotmail.com?']
    }]);

    assert.equals(enforceRules(rules, {emailAddress: 'john@hotmail.se'}), [{
      id: 'emailAddress',
      messages: ['Did you mean hotmail.com?']
    }]);

    assert.equals(enforceRules(rules, {emailAddress: 'john@gmail.no'}), [{
      id: 'emailAddress',
      messages: ['Did you mean gmail.com?']
    }]);

    assert.equals(enforceRules(rules, {emailAddress: 'john@gmail.se'}), [{
      id: 'emailAddress',
      messages: ['Did you mean gmail.com?']
    }]);
  });

  it('supports nested names', function () {
    var rules = [email('emails[home]', {missingAt: 'Missing @'})];

    assert.equals(enforceRules(rules, {emails: {home: 'john+doe.com'}}), [{
      id: 'emails[home]',
      messages: ['Missing @']
    }]);
  });
});

describe('minlength', function () {
  it('allows blank value', function () {
    var rules = [minlength('name', 8, 'Name must be longer')];

    assert.equals(enforceRules(rules, {}), []);
  });

  it('does not allow field to have less content than specified length', function () {
    var rules = [minlength('name', 8, 'Name must be longer')];

    assert.equals(enforceRules(rules, {name: '123'}), [
      {id: 'name', messages: ['Name must be longer']}
    ]);
  });

  it('renders message with specified length requirement', function () {
    var rules = [minlength('name', 8, 'Name must be at least {length} character')];

    assert.equals(enforceRules(rules, {name: '123'}), [
      {id: 'name', messages: ['Name must be at least 8 character']}
    ]);
  });

  it('does allow field to have content exactly the specified length', function () {
    var rules = [minlength('name', 8, 'Name must be longer')];

    assert.equals(enforceRules(rules, {name: '12345678'}), []);
  });

  it('does allow field to have content longer the specified length', function () {
    var rules = [minlength('name', 8, 'Name must be longer')];

    assert.equals(enforceRules(rules, {name: '1234567890123456789'}), []);
  });

  it('supports nested names', function () {
    var rules = [minlength('name[first]', 8, 'Name must be longer')];

    assert.equals(enforceRules(rules, {name: {first: 'Meh'}}), [{
      id: 'name[first]',
      messages: ['Name must be longer']
    }]);
  });
});
