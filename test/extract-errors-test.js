/*global describe, it, assert, beforeEach*/
'use strict';
var extractErrors = require('../').extractErrors;
var addElement = require('../src/elem').addElement;

describe('extractErrors', function () {
  var form;

  beforeEach(function () {
    form = document.createElement('form');
  });

  it('fetches errors for a field', function () {
    addElement(form, 'input', {type: 'text', name: 'phoneNumber', value: '+47 998 87 766'});
    var span = addElement(form, 'span', {data: {'errors-for': 'phoneNumber'}});
    addElement(span, 'span', {innerHTML: 'Something wrong'});

    assert.equals(extractErrors(form), [{
      id: 'phoneNumber',
      messages: ['Something wrong']
    }]);
  });
});
