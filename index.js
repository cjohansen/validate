module.exports = {
  extractData: require('./src/extract-data'),
  extractErrors: require('./src/extract-errors'),
  createRenderers: require('./src/render').createRenderers,
  rules: require('./src/rules'),
  validateForm: require('./src/validate-form')
};
