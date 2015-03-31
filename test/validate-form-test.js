/*global describe, beforeEach, afterEach, it, assert*/
'use strict';
var validate = require('../');
var validateForm = validate.validateForm;
var required = validate.rules.required;
var and = validate.rules.and;
var email = validate.rules.email;
var addElement = require('../src/elem').addElement;
var syn = require('syn');

describe('validateForm', function () {
  var form, submit, emailInput;

  var rules = [and(
    required('email', 'Email can\'t be blank.'),
    email('email', { missingTLD: 'Missing TLD' })
  )];

  beforeEach(function () {
    form = addElement(document.body, 'form');
    addElement(form, 'div', {data: {'errors-for': 'email'}});
    emailInput = addElement(form, 'input', {name: 'email', id: 'email'});
    submit = addElement(form, 'input', {type: 'submit', id: 'submit', value: 'Send'});
  });

  afterEach(function () {
    document.body.removeChild(form);
  });

  it('renders errors on submit', function (done) {
    validateForm(form, rules);

    syn.click(submit, function () {
      var error = form.querySelector('[data-errors-for=email] div');
      assert.equals(error.innerHTML, 'Email can\'t be blank.');
      done();
    });
  });

  it('removes errors when fixed', function (done) {
    validateForm(form, rules);

    syn.click(submit).
      click(emailInput).
      type('john@doe', function () {
        var errors = form.querySelectorAll('[data-errors-for=email] div');
        assert.equals(errors.length, 0);
        done();
      });
  });

  it('adds new errors when leaving field after initial submit', function (done) {
    validateForm(form, rules);

    syn.click(submit).
      click(emailInput).
      type('john@doe\t', function () {
        var errors = form.querySelectorAll('[data-errors-for=email] div');
        assert.equals(errors.length, 1);
        done();
      });
  });

  it('calls callback on success', function (done) {
    var event, callbackForm;

    validateForm(form, rules, {
      success: function (e) {
        e.preventDefault();
        event = e;
        callbackForm = this;
      }
    });

    syn.click(emailInput).
      type('john@doe.com\t').
      click(submit, function () {
        assert(event);
        assert.equals(callbackForm, form);
        done();
      });
  });
});
