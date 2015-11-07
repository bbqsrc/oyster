const gulp = require('gulp');
const gutil = require('gulp-util');
const webdriver = require('gulp-webdriver');
const webpack = require('webpack');
const istanbul = require('gulp-istanbul');
const codecov = require('gulp-codecov.io');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const babelify = require('babelify');
const factor = require('factor-bundle');

const webpackConfig = require('./src/webpack.config.js');

gulp.task('instrument-js', function() {
  return gulp.src('app/**/*.js')
    .pipe(istanbul())
    // XXX: This breaks the stream, and doesn't appear to be required anyway
    //.pipe(istanbul.hookRequire())
    .pipe(gulp.dest('instrumented/app/'));
});

gulp.task('copy-test-content', function() {
  return gulp.src('content/**/*')
    .pipe(gulp.dest('instrumented/content'));
});

gulp.task('copy-test-views', function() {
  return gulp.src('app/views/**/*')
    .pipe(gulp.dest('instrumented/app/views'));
});

gulp.task('copy-test-assets', function() {
  return gulp.src('assets/**/*')
    .pipe(gulp.dest('instrumented/assets/'));
});

gulp.task('copy-test-files', [
  'copy-test-views', 'copy-test-content', 'copy-test-assets'
]);

gulp.task('test:coverage', ['instrument-js', 'copy-test-files'], function() {
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

// FIXME: This task shouldn't be necessary - bootstrap and jquery should be
// in the bundle, but right now they're manually included via <script> tags.
// The code that uses these needs to be reworked to properly require() them, so
// that browserify can bundle these appropriately.
gulp.task('copy-js', function() {
  return gulp.src([
      './node_modules/bootstrap/dist/js/bootstrap.min.js',
      './node_modules/jquery/dist/jquery.min.js'
    ])
    .pipe(gulp.dest('./assets/static/js'));
})

gulp.task('copy-css', function() {
  return gulp.src('./node_modules/bootstrap/dist/css/bootstrap.min.css')
    .pipe(gulp.dest('./assets/static/css'));
});

gulp.task('copy-fonts', function() {
  return gulp.src('./node_modules/bootstrap/dist/fonts/**')
    .pipe(gulp.dest('./assets/static/fonts'));
});

gulp.task('browserify:build', function() {
  const production = gutil.env.type === 'production';

  return browserify({
      debug: !production,
      entries: [
        'src/index.js'
      ],
      extensions: ['.jsx']
    })
    .transform(babelify, {
      stage: 0
    })
    /*
    .plugin(factor, {
      outputs: [
        'assets/static/js/components.min.js'
      ]
    })
    .bundle()
    .pipe(source('vendor.min.js'))
    */
    .bundle()
    .pipe(source('components.min.js'))
    // TODO: Add Uglify here
    .pipe(gulp.dest('assets/static/js/'));
});

// TODO: watchify dev task

//gulp.task('build-assets', ['webpack:build', 'copy-css', 'copy-js']);
gulp.task('build-assets', ['browserify:build', 'copy-css', 'copy-js', 'copy-fonts']);
