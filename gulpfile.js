var gulp = require("gulp");
var gutil = require("gulp-util");
var webdriver = require("gulp-webdriver");
var webpack = require("webpack");

var webpackConfig = require("./src/webpack.config.js");

gulp.task("test:coverage", function(cb) {
  // TODO equivalent of: istanbul cover wdio -- test/wdio.conf.js
});

gulp.task("test:coverage:upload", function(cb) {
  // TODO equivalent of: cat ./coverage/coverage.json | codecov
});

gulp.task("copy-js", function() {
  return gulp.src([
                "./node_modules/bootstrap/dist/js/bootstrap.min.js",
                "./node_modules/jquery/dist/jquery.min.js"
              ])
             .pipe(gulp.dest("./assets/static/js"));
});
gulp.task("copy-css", function() {
  return gulp.src("./node_modules/bootstrap/dist/css/bootstrap.min.css")
             .pipe(gulp.dest("./assets/static/css"));
});

gulp.task("webpack", function(cb) {
  webpack(webpackConfig, (err, stats) => {
    if (err) throw new gutil.PluginError("webpack", err);

    gutil.log("[webpack]", stats.toString());

    cb();
  });
});

gulp.task("build-assets", ["webpack", "copy-css", "copy-js"]);

gulp.task("test", function(cb) {
  return gulp.src("test/wdio.conf.js").pipe(webdriver({
    reporter: "spec" 
  }));
});

// TODO: Also hook up webpack-dev-server
