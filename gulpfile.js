const gulp = require('gulp');
const gutil = require('gulp-util');
const webdriver = require('gulp-webdriver');
const webpack = require('webpack');
const istanbul = require('gulp-istanbul');
const codecov = require('gulp-codecov.io');

const webpackConfig = require('./src/webpack.config.js');

gulp.task('instrument-js', function() {
  return gulp.src('app/**/*.js')
    .pipe(istanbul())
    // XXX: This breaks the stream, and doesn't appear to be required anyway
    //.pipe(istanbul.hookRequire())
    .pipe(gulp.dest('instrumented/app/'));
});

gulp.task('copy-test-content', function() {
  return gulp.src('content')
    .pipe(gulp.dest('instrumented/'));
});

gulp.task('test:coverage', ['instrument-js', 'copy-test-content'], function() {
  return gulp.src('test/wdio.conf.js')
    .pipe(webdriver({
      reporter: 'spec' 
    }))
    .pipe(istanbul.writeReports());
});

gulp.task('test:coverage:upload', function() {
  return gulp.src('coverage/coverage.json')
    .pipe(codecov());
  // TODO equivalent of: cat ./coverage/coverage.json | codecov
});

gulp.task('copy-js', function() {
  return gulp.src([
      './node_modules/bootstrap/dist/js/bootstrap.min.js',
      './node_modules/jquery/dist/jquery.min.js'
    ])
    .pipe(gulp.dest('./assets/static/js'));
});

gulp.task('copy-css', function() {
  return gulp.src('./node_modules/bootstrap/dist/css/bootstrap.min.css')
    .pipe(gulp.dest('./assets/static/css'));
});

gulp.task('webpack', function(cb) {
  webpack(webpackConfig, (err, stats) => {
    if (err) throw new gutil.PluginError('webpack', err);

    gutil.log('[webpack]', stats.toString());

    cb();
  });
});

gulp.task('build-assets', ['webpack', 'copy-css', 'copy-js']);

// TODO: Also hook up webpack-dev-server
