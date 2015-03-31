/*global validate*/
var and = validate.rules.and;
var required = validate.rules.required;
var email = validate.rules.email;

validate.validateForm(document.querySelector('form'), [
  and(
    required('email', 'Please enter your email'),
    email('email', {
      missingAt: 'Missing @',
      missingUser: 'You need something in front of the @',
      missingDomain: 'You need something after the @',
      missingTLD: 'Did you forget .com or something similar?',
      almostHotmail: 'Did you mean hotmail<strong>.com</strong>?',
      almostGmail: 'Did you mean gmail<strong>.com</strong>?'
    })
  ),
  required('password', 'Please enter a password')
], {
  success: function (event) {
    // If something needs to be done before submitting
  }
});
