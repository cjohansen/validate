'use strict';
var elem = require('./elem');

function clearErrors(error, form) {
  elem.getErrorElement(error, form).innerHTML = '';
  elem.rmClass(elem.getInput(error, form), 'invalid');
}

function renderErrors(error, form) {
  elem.addClass(elem.getInput(error, form), 'invalid');
  elem.getErrorElement(error, form).innerHTML = error.messages.map(function (message) {
    return '<div>' + message + '</div>';
  }).join('');
}

function isSameMessage(item, error) {
  return item.id === error.id &&
    item.messages.join(',') === error.messages.join(',');
}

function isSameField(item, error) {
  return item.id === error.id;
}

function contains(coll, error, pred) {
  for (var i = 0; i < coll.length; ++i) {
    if (pred(coll[i], error)) {
      return true;
    }
  }
}

function difference(set1, set2, pred) {
  return set1.filter(function (err) {
    return !contains(set2, err, pred);
  });
}

exports.createRenderers = function (form) {
  var prevErrors = [];
  return {
    renderErrors: function (nextErrors) {
      var removedErrors = difference(prevErrors, nextErrors, isSameField);
      var addedErrors = difference(nextErrors, prevErrors, isSameMessage);

      removedErrors.forEach(function (error) { clearErrors(error, form); });
      addedErrors.forEach(function (error) { renderErrors(error, form); });
      prevErrors = nextErrors;
    },
    removeErrors: function (nextErrors) {
      var removedErrors = difference(prevErrors, nextErrors, isSameMessage);
      removedErrors.forEach(function (error) { clearErrors(error, form); });
    }
  };
};
