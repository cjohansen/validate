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
