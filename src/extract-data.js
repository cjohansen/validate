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
