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
