/*global describe, it, assert, SPiD, beforeEach*/
'use strict';
var extractData = require('../').extractData;
var elem = require('../src/elem');
var createElement = elem.createElement;
var addElement = elem.addElement;

describe('extractData', function () {
  var form;

  beforeEach(function () {
    form = document.createElement('form');
  });

  it('fetches data out of a form', function () {
    addElement(form, 'input', {type: 'text', name: 'phoneNumber', value: '+47 998 87 766'});

    assert.equals(extractData(form), {'phoneNumber': '+47 998 87 766'});
  });

  it('trims form data', function () {
    addElement(form, 'input', {type: 'text', name: 'phoneNumber', value: '     LOL     '});

    assert.equals(extractData(form), {'phoneNumber': 'LOL'});
  });

  it('ignores empty fields', function () {
    addElement(form, 'input', {type: 'text', name: 'phoneNumber'});

    assert.equals(extractData(form), {});
  });

  it('extracts data from textareas', function () {
    addElement(form, 'textarea', {name: 'description', innerHTML: 'w3c rocks'});

    assert.equals(extractData(form), {'description': 'w3c rocks'});
  });

  it('extracts data from radio button', function () {
    addElement(form, 'input', { type: 'radio', checked: true, name: 'fruit', value: 'apple' });
    addElement(form, 'input', { type: 'radio', checked: false, name: 'fruit', value: 'pear' });

    assert.equals(extractData(form), {fruit: 'apple'});
  });

  it('extracts data from select', function () {
    var select = createElement('select', { name: 'bananas' });
    select.appendChild(createElement('option', { value: 'curved', selected: true }));
    select.appendChild(createElement('option', { value: 'straight' }));
    form.appendChild(select);

    assert.equals(extractData(form), {bananas: 'curved'});
  });

  it('skips blank select option', function () {
    var select = createElement('select', { name: 'bananas' });
    select.appendChild(createElement('option', { value: '' }));
    select.appendChild(createElement('option', { value: 'curved' }));
    select.appendChild(createElement('option', { value: 'straight' }));
    form.appendChild(select);

    assert.equals(extractData(form), {});
  });

  it('extracts data from checkboxen', function () {
    addElement(form, 'input', { type: 'checkbox', checked: false, name: 'pear', value: 'yes' });
    addElement(form, 'input', { type: 'checkbox', checked: true, name: 'banana', value: 'indeed' });

    assert.equals(extractData(form), {'banana': 'indeed'});
  });

  it('extracts data from checkboxen without value', function () {
    addElement(form, 'input', { type: 'checkbox', checked: false, name: 'pear' });
    addElement(form, 'input', { type: 'checkbox', checked: true, name: 'banana' });

    assert.equals(extractData(form), {'banana': 'on'});
  });

  it('ignores submit buttons', function () {
    addElement(form, 'input', { type: 'submit', value: 'Do it!' });

    assert.equals(extractData(form), {});
  });

  it('ignores inputs without name', function () {
    addElement(form, 'input', { type: 'text', value: 'Do it!' });

    assert.equals(extractData(form), {});
  });

  it('extracts emails[] as a list', function () {
    addElement(form, 'input', {type: 'text', name: 'emails[]', value: 'me@example.com'});

    assert.equals(extractData(form), {'emails': ['me@example.com']});
  });

  it('extracts multiple list items', function () {
    addElement(form, 'input', {type: 'text', name: 'emails[]', value: 'me@example.com'});
    addElement(form, 'input', {type: 'text', name: 'emails[]', value: 'you@example.com'});

    assert.equals(extractData(form), {'emails': ['me@example.com', 'you@example.com']});
  });

  it('extracts emails[home] as an object', function () {
    addElement(form, 'input', {type: 'text', name: 'emails[home]', value: 'me@example.com'});

    assert.equals(extractData(form), {emails: {home: 'me@example.com'}});
  });

  it('extracts emails[types][home] as a nested object', function () {
    addElement(form, 'input', {type: 'text', name: 'emails[types][home]', value: 'me@example.com'});

    assert.equals(extractData(form), {emails: {types: {home: 'me@example.com'}}});
  });

  it('extracts emails[types][home][] as a nested list', function () {
    addElement(form, 'input', {type: 'text', name: 'emails[types][home][]', value: 'me@example.com'});

    assert.equals(extractData(form), {emails: {types: {home: ['me@example.com']}}});
  });
});
