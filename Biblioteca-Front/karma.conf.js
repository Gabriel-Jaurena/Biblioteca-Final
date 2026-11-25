// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html
//
// Se declara explícitamente porque el builder `@angular/build:karma` solo emite
// reportes `html` y `text-summary` por defecto. Codecov necesita `lcovonly`.

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
    ],
    jasmineHtmlReporter: {
      // removes the duplicated traces
      suppressAll: true,
    },
    coverageReporter: {
      dir: require('path').join(__dirname, 'coverage', 'biblioteca'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcovonly' },
      ],
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['Chrome'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',
          '--headless',
          '--disable-gpu',
          '--disable-dev-shm-usage',
        ],
      },
    },
    restartOnFileChange: true,
  });
};
