'use strict';

var slice = Array.prototype.slice;

function findElements(parent, selector) {
  return slice.call(parent.querySelectorAll(selector));
}

exports.findElements = findElements;

exports.getErrorElement = function (field, form) {
  return findElements(form, '[data-errors-for]').filter(function (el) {
    return el.getAttribute('data-errors-for') === field.id;
  })[0];
};

exports.getInput = function (field, form) {
  return findElements(form, '[name]').filter(function (el) {
    return el.name === field.id;
  })[0] || {className: ''};
};

exports.getInputs = function (form) {
  return findElements(form, 'input[name]').
    concat(findElements(form, 'textarea[name]')).
    concat(findElements(form, 'select[name]'));
};

exports.hasClass = function (el, cn) {
  return new RegExp('(^|\\s)' + cn + '(\\s|$)').test(el.className);
};

exports.addClass = function (el, cn) {
  if (!el || exports.hasClass(el, cn)) {
    return;
  }
  el.className = (el.className + ' ' + cn).trim();
};

exports.rmClass = function (el, cn) {
  if (!el || !exports.hasClass(el, cn)) {
    return;
  }

  var re = new RegExp('(^|\\s)' + cn + '(\\s|$)', 'g');
  el.className = el.className.replace(re, '').replace(/\s\s+/g, ' ').trim();
};

exports.createElement = function (tag, attrs) {
  var el = document.createElement(tag);
  for (var attr in attrs) {
    if (attr === 'data') {
      for (var data in attrs[attr]) {
        el.setAttribute('data-' + data, attrs[attr][data]);
      }
    } else {
      el[attr] = attrs[attr];
    }
  }
  return el;
};

exports.addElement = function (parent, tag, attrs) {
  var element = exports.createElement(tag, attrs);
  parent.appendChild(element);
  return element;
};
