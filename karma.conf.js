module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', 'referee', 'browserify'],

    files: ['test/**/*.js'],

    browserify: {
      debug: true
    },

    exclude: [],

    preprocessors: {
      'test/**/*.js': [ 'browserify' ]
    },

    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false
  });
};
