/*global describe, it, assert, beforeEach*/
'use strict';
var createRenderers = require('../').createRenderers;
var addElement = require('../src/elem').addElement;

describe('render', function () {
  var form, render, remove;

  beforeEach(function () {
    form = document.createElement('form');
    var renderers = createRenderers(form);
    render = renderers.renderErrors;
    remove = renderers.removeErrors;
  });

  it('adds error message to container by data-errors-for attribute', function () {
    var element = addElement(form, 'div', {data: {'errors-for': 'name'}});
    render([{id: 'name', messages: ['You suck']}]);

    assert.equals(element.childNodes.length, 1);
    assert.equals(element.firstChild.innerHTML, 'You suck');
  });

  it('adds error message for nested name', function () {
    var element = addElement(form, 'div', {data: {'errors-for': 'name[first]'}});
    render([{id: 'name[first]', messages: ['You suck']}]);

    assert.equals(element.childNodes.length, 1);
    assert.equals(element.firstChild.innerHTML, 'You suck');
  });

  it('does not manipulate the DOM when the errors are the same', function () {
    var element = addElement(form, 'div', {data: {'errors-for': 'name'}});
    render([{id: 'name', messages: ['You suck']}]);
    var renderedError = element.firstChild;

    render([{id: 'name', messages: ['You suck']}]);
    assert.equals(element.childNodes.length, 1);
    assert.same(renderedError, element.firstChild);
  });

  it('changes error message for field', function () {
    var element = addElement(form, 'div', {data: {'errors-for': 'name'}});

    render([{id: 'name', messages: ['You suck']}]);
    render([{id: 'name', messages: ['You are not so OK']}]);

    assert.equals(element.childNodes.length, 1);
    assert.equals(element.firstChild.innerHTML, 'You are not so OK');
  });

  it('removes error messages', function () {
    var element = addElement(form, 'div', {data: {'errors-for': 'name'}});
    render([{id: 'name', messages: ['You suck']}]);
    render([]);

    assert.equals(element.childNodes.length, 0);
  });

  it('renders multiple error messages', function () {
    var element = addElement(form, 'div', {data: {'errors-for': 'name'}});
    render([{id: 'name', messages: ['You suck', 'Wrong']}]);

    assert.equals(element.childNodes.length, 2);
  });

  it('adds additional error message for field', function () {
    var element = addElement(form, 'div', {data: {'errors-for': 'name'}});

    render([{id: 'name', messages: ['You suck']}]);
    render([{id: 'name', messages: ['You suck', 'Wrong']}]);

    assert.equals(element.childNodes.length, 2);
  });

  it('marks input as invalid', function () {
    addElement(form, 'div', {data: {'errors-for': 'name'}});
    var input = addElement(form, 'input', {name: 'name'});

    render([{id: 'name', messages: ['You suck']}]);

    assert.equals(input.className, 'invalid');
  });

  it('clears removed errors', function () {
    var element = addElement(form, 'div', {data: {'errors-for': 'name'}});
    var input = addElement(form, 'input', {name: 'name'});

    render([{id: 'name', messages: ['You suck']}]);
    remove([]);

    assert.equals(element.childNodes.length, 0);
    assert.equals(input.className, '');
  });

  it('clears the error you fixed, does not render new ones', function () {
    var element = addElement(form, 'div', {data: {'errors-for': 'name'}});

    render([{id: 'name', messages: ['You suck']}]);
    remove([{id: 'name', messages: ['Your father sucks']}]);

    assert.equals(element.childNodes.length, 0);
  });

  it('doesn\'t clear errors you haven\'t fixed', function () {
    var element = addElement(form, 'div', {data: {'errors-for': 'name'}});

    render([{id: 'name', messages: ['You suck']}]);
    remove([{id: 'name', messages: ['You suck']}]);

    assert.equals(element.childNodes.length, 1);
  });
});
