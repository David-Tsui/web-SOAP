var gulp          = require('gulp'),             
	gulpSass        = require('gulp-sass'),
  gulpConcat      = require('gulp-concat'),
  gulpMinifyCSS   = require('gulp-minify-css'),
	gulpUglify      = require('gulp-uglify'),
  gulpRename      = require("gulp-rename"),
  gulpHtmlReplace = require('gulp-html-replace'),
  gulpMinifyHTML  = require('gulp-minify-html'),
	gulpPlumber     = require('gulp-plumber'),
  http = require('http'),
  st = require('st'),
  gulpLivereload  = require('gulp-livereload');

gulp.task('styles', function(callback) {
  gulp.src('./src/scss/*.scss')
    .pipe(gulpPlumber())
    .pipe(gulpSass())   
    .pipe(gulp.dest('./src/css'))
    .pipe(gulpLivereload());
  callback();
});

gulp.task('concat', gulp.series('styles', function(callback) {
  gulp.src('./src/css/*.css')
    .pipe(gulpPlumber())
    .pipe(gulpConcat("bundle.css"))
    .pipe(gulp.dest('./build/css/'))
    .pipe(gulpLivereload());
  callback();
}));

gulp.task('scripts', function(callback) {
  gulp.src('./src/js/*.js')
    .pipe(gulpPlumber())      
    .pipe(gulpUglify())
    .pipe(gulpRename(function(path) {
      path.basename += ".min";
      path.extname = ".js";
    }))                  
    .pipe(gulp.dest('./build/js'))
    .pipe(gulpLivereload());
  callback();
});

gulp.task('html-replace', function(callback) {
  var opts = {comments: false, spare: false, quotes: true};
  return gulp.src('./src/html/index.html')
    .pipe(gulpPlumber())
    // .pipe(gulpHtmlReplace({
    //   'css': './build/css/bundle.min.css'
    // }))  
    .pipe(gulpHtmlReplace())
    .pipe(gulpMinifyHTML(opts))
    .pipe(gulp.dest('./'))
    .pipe(gulpLivereload());
  callback();
});


gulp.task('minify-css', gulp.series('concat', function(callback) {
  return gulp.src('./src/css/.css')
    .pipe(gulpPlumber())
    .pipe(gulpMinifyCSS({
      keepBreaks: true,
    }))
    .pipe(gulpRename(function(path) {
      path.basename += ".min";
      path.extname = ".css";
    }))
    .pipe(gulp.dest('./build/css'))
    .pipe(gulpLivereload());
  callback();
}));

gulp.task('server', function(done) {
  http.createServer(
    st({ path: __dirname, index: 'index.html', cache: false })
  ).listen(8080, done);
});

gulp.task('watch', gulp.parallel('server', function(callback) {
  gulpLivereload.listen();
  gulp.watch('./src/scss/*.scss', gulp.series('concat'));
  gulp.watch('./src/js/*.js', gulp.series('scripts'));
  gulp.watch('./src/html/*.html', gulp.series('html-replace'));
}));

gulp.task('default', gulp.series('scripts', 'styles', 'concat', 'watch'));