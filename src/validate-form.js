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
