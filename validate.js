(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.validate = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = {
  extractData: require('./src/extract-data'),
  extractErrors: require('./src/extract-errors'),
  createRenderers: require('./src/render').createRenderers,
  rules: require('./src/rules'),
  validateForm: require('./src/validate-form')
};

},{"./src/extract-data":3,"./src/extract-errors":4,"./src/render":5,"./src/rules":6,"./src/validate-form":7}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
/**
 * Extract data from a form. Given a form, extractData will return an object
 * describing all data entered into it. Any input, select and textarea elements
 * with data in them will be serialized into an object:
 *
 * <form>
 *   <label for='email'>
 *     Email
 *     <input type='email' name='email' value='christian@cjohansen.no' id='email' class='input'>
 *   </label>
 *   <label for='password'>
 *     Password
 *     <input type='password' name='password' id='password' class='input'>
 *   </label>
 *   <label class='faded'>
 *     <input type='checkbox' name='remember-me' checked>
 *     Remember me
 *   </label>
 *   <input type='submit' class='btn-primary' value='Logg inn'>
 * </form>
 *
 * Will result in the object:
 *
 *     {email: 'christian@cjohansen.no', 'remember-me': 'on'}
 *
 * Fields with no value (or with only blank strings, e.g. ' ') are not included
 * in the extracted data.
 *
 * Extracting data this way opens up for several interesting applications. The
 * intended use here is a form/data validation system that is not coupled to the
 * DOM, but this would easily be usable to build query strings for synthetisized
 * GET requests, or sending the resulting object as JSON with an XMLHttpRequest,
 * persisting state in localStorage etc etc.
 */
'use strict';
var elem = require('./elem');

var setPath = function (data, pathname, value) {
  var path = pathname.replace(/\]/g, '').split('[');

  if (path.length < 2) {
    data[pathname] = value;
    return;
  }

  for (var i = 0; i < path.length - 1; i++) {
    // Falsy path[i+1] means the last item is blank, which indicates
    // that this is a list, e.g. name[sub][] => {name: {sub: []}} or
    // name[] => {name: []}
    data[path[i]] = data[path[i]] || (!path[i+1] ? [] : {});
    data = data[path[i]];
  }

  if (!path[i]) {
    data.push(value);
  } else {
    data[path[i]] = value;
  }
};

var useValue = function (input) {
  if (input.type === 'submit') { return false; }
  if (input.type === 'radio' || input.type === 'checkbox') { return input.checked; }
  return !!input.value && !!input.name;
};

var getValue = {
  input: function (input) {
    if (useValue(input)) { return input.value; }
  },

  textarea: function (textarea) {
    if (textarea.innerHTML) { return textarea.innerHTML; }
  },

  select: function (select) {
    var val = select.options[select.selectedIndex].value;
    if (val) { return val; }
  }
};

module.exports = function (form) {
  return elem.getInputs(form).reduce(function (data, el) {
    var val = getValue[el.tagName.toLowerCase()](el);
    if (val) { setPath(data, el.name, val.trim()); }
    return data;
  }, {});
};

},{"./elem":2}],4:[function(require,module,exports){
/**
 * Extracts validation errors from the markup, typically for server-generated
 * errors. Can be used to initialize the error renderer so server-generated
 * errors will be cleared as the user interacts with the form.
 *
 * Given a form like
 *
 * <form>
 *   <div class='form-element'>
 *     <label for='email'>
 *       E-post
 *       <span class='errors' data-errors-for='email'><span>Please enter your email</span></span>
 *       <input type='email' name='email' value='christian@kodemaker.no' id='email' class='input'>
 *     </label>
 *   </div>
 *   <div class='form-element'>
 *     <label for='email'>
 *       Passord
 *       <input type='password' name='password' id='password' class='input'>
 *     </label>
 *   </div>
 *   <div class='form-element'>
 *     <input type='submit' class='btn-primary' value='Logg inn'>
 *   </div>
 *   <a href='/glemt-passord.html'>Glemt passordet?</a>
 * </form>
 *
 * Will result in the array:
 *
 *     [{id: 'email', messages: ['Please enter your email']}]
 *
 * This function assumes that error messages are contained in an element with a
 * data attribute: 'data-errors-for="[name-of-field]"'
 */
'use strict';

var elem = require('./elem');

function errorsFor(field, form) {
  var container = elem.getErrorElement(field, form);
  if (!container) { return []; }
  return elem.findElements(container, 'span').map(function (err) {
    return err.innerHTML;
  });
}

module.exports = function (form) {
  return elem.getInputs(form).reduce(function (errors, el) {
    var messages = errorsFor({ id: el.name }, form);
    if (messages.length > 0) {
      errors.push({ id: el.name, messages: messages });
    }
    return errors;
  }, []);
};

},{"./elem":2}],5:[function(require,module,exports){
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

},{"./elem":2}],6:[function(require,module,exports){
/**
 * The main rule engine of the form/data validation system. Rules operate solely
 * on data: regular JavaScript objects in, JavaScript objects out. These rules
 * may be used for form validation with the help of extractData and the render
 * function, or may be used with vanilla data objects from any source.
 *
 * Validators are functions that return functions (that in turn will perform the
 * actual validation). The validator itself does not need to conform to any
 * specific interface, as it is used solely by client code (e.g. not the
 * validation library itself). The function returned from the validation
 * function should accept one argument, the full data to be validated. Most
 * validators take the id of a field to validate as their first argument. When
 * the validation is performed, this id can be used to retrieve the value of the
 * field to be validated:
 *
 * function myValidator(id) {
 *   return function (data) {
 *     // data[id] is the value of the field to validate
 *   }
 * }
 *
 * When a validator passes, it should return a falsy value (e.g. no return
 * statement at all works well). When it fails, it should return a description
 * of the error: an object with id and msg properties.
 *
 * Note: Making the validators simple predicates, and automating the returned
 * object (id, msg) has been considered, but it has currently been decided that
 * the flexibility afforded by the current design weighs up for the slight
 * manual repetition of the returned object for most validators.
 */
'use strict';

function getPath(data, name) {
  var path = name.replace(/\]/g, '').split('[');

  for (var i = 0; i < path.length; i++) {
    if (!data[path[i]]) { return null; }
    data = data[path[i]];
  }

  return data;
}

/**
 * Requires the value to a non-empty and non-blank string/value.
 */
function required(id, msg) {
  return function (data) {
    if (!getPath(data, id)) {
      return {id: id, msg: msg};
    }
  };
}

/**
 * Validate against any regular expression. Passes for blank values.
 */
function pattern(id, re, msg) {
  return function (data) {
    var val = getPath(data, id);
    if (val && !re.test(val)) {
      return {id: id, msg: msg};
    }
  };
}

/**
 * Compose several validators into one.
 */
function and() {
  var rules = arguments;
  return function (data) {
    var result, l = rules.length;
    for (var i = 0; i < l; ++i) {
      result = rules[i](data);
      if (result) { return result; }
    }
  };
}

/**
 * Satisfy at least one of several validators
 */
function or() {
  var rules = arguments;
  return function (data) {
    var result, l = rules.length;
    for (var i = 0; i < l; ++i) {
      result = rules[i](data);
      if (!result) { return; }
    }
    return result;
  };
}

/**
 * Run a validator rule when the predicate returns true. The predicate
 * should be a function that accepts one argument; the whole data structure.
 */
function when(pred, rule) {
  return function (data) {
    if (pred(data)) { return rule(data); }
  };
}

/**
 * A predicate to be used with when(). Returns true when the named property
 * (id) matches the provided pattern:
 *
 *     when(matches("name", /^\w+$/), pattern("name", /^[A-Z]/));
 *
 * If the name matches the pattern, it is required to start with a capital
 * letter.
 */
function matches(id, re) {
  return function (data) {
    return re.test(getPath(data, id));
  };
}

/**
 * Email validator, composed of a bunch of pattern checks with to-the-point
 * error messages. Client-side form validation is a usability feature, not a
 * security feature, this validator takes that job seriously, and tries to
 * help the user catch common problems in email addresses, rather than being
 * an absolutely exhaustive check for validity.
 */
function email(id, messages) {
  return and(
    pattern(id, /@/, messages.missingAt),
    pattern(id, /^\S+@/, messages.missingUser),
    pattern(id, /@\S+$/, messages.missingDomain),
    pattern(id, /@\S+\.\S+$/, messages.missingTLD),
    when(matches(id, /@hotmail\.[^\.]+$/),
         pattern(id, /@hotmail\.com$/, messages.almostHotmail)
        ),
    when(matches(id, /@gmail\.[^\.]+$/),
         pattern(id, /@gmail\.com$/, messages.almostGmail)
        )
  );
}

/**
 * Modifier to use with when(). Guard validators with this to only validate
 * visible fields. An element is deemed visible when it has a visible area >
 * 1, e.g. its clientHeight and clientWidth are both >= 1px.
 */
function isVisible(el) {
  return function (/*data*/) {
    return !!el && el.clientWidth * el.clientHeight >= 1;
  };
}

function exists(id) {
  return function (/*data*/) {
    return !!document.getElementById(id);
  };
}

function minlength(id, length, msg) {
  return function (data) {
    var val = getPath(data, id);
    if (val && val.length < length) {
      return {id: id, msg: msg.replace('{length}', length)};
    }
  };
}

function enforceRules(rules, data) {
  if (!Array.isArray(rules)) {
    throw new Error('enforceRules expects rules to be an array, was ' + typeof rules);
  }
  var tmp = {};
  return rules.reduce(function (errors, rule) {
    var error = rule(data);
    if (error) {
      if (!tmp[error.id]) {
        tmp[error.id] = {id: error.id};
        tmp[error.id].messages = [];
        errors.push(tmp[error.id]);
      }
      tmp[error.id].messages.push(error.msg);
    }
    return errors;
  }, []);
}

module.exports = {
  required: required,
  pattern: pattern,
  and: and,
  or: or,
  isVisible: isVisible,
  exists: exists,
  when: when,
  email: email,
  minlength: minlength,
  enforceRules: enforceRules
};

},{}],7:[function(require,module,exports){
/**
 * The high-level validation function. See the tests for examples of use. This
 * function takes an HTML form and a set of rules and validates the form as the
 * user interacts with it:
 *
 *   - First validation happens on submit
 *   - After the initial submit, errors are cleared as they are fixed
 *   - After the initial submit, when the user leaves a field, it is completely
 *     revalidated, possibly rendering a new error for that field
 *
 * The rendering logic is fairly simple at this point. The actual rendering is
 * performed by render.js. This model can easily accommodate more advanced
 * visual representation (encapsulating label+input in a red border, adding faux
 * boxes, popups or whatever) - it is just a matter of writing a sufficiently
 * sophisticated renderer.
 */
'use strict';

var enforceRules = require('./rules').enforceRules;
var extractErrors = require('./extract-errors');
var extractData = require('./extract-data');
var createRenderers = require('./render').createRenderers;

function toId(error) {
  return error.id;
}

module.exports = function (form, rules, options) {
  options = options || {};
  var renderers = createRenderers(form);
  var enabledInputs = {};

  function findErrors() {
    return enforceRules(rules, extractData(form));
  }

  function removeErrors() {
    renderers.removeErrors(findErrors());
  }

  function updateErrors() {
    renderers.renderErrors(findErrors());
  }

  function enableLiveValidation(id) {
    if (!enabledInputs[id]) {
      enabledInputs[id] = true;
      var input = form.querySelector('[name="' + id + '"]');
      input.addEventListener('keyup', removeErrors);
      input.addEventListener('blur', updateErrors);
      input.addEventListener('click', updateErrors);
    }
  }

  renderers.renderErrors(extractErrors(form));

  form.addEventListener('submit', function (e) {
    var errors = findErrors();
    if (errors.length) {
      e.preventDefault();
      renderers.renderErrors(errors);
      errors.map(toId).forEach(enableLiveValidation);
    } else if (typeof options.success === 'function') {
      options.success.call(form, e);
    }
  });
};

},{"./extract-data":3,"./extract-errors":4,"./render":5,"./rules":6}]},{},[1])(1)
});