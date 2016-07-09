var gulp            = require('gulp'), 
    gulpSass        = require('gulp-sass'),
    gulpConcat      = require('gulp-concat'),
    gulpCleanCss    = require('gulp-clean-css'),
    gulpSourceMaps  = require('gulp-sourcemaps'),
    gulpUglify      = require('gulp-uglify'),
    gulpImageMin    = require('gulp-imagemin');
    gulpRename      = require("gulp-rename"),
    gulpRev         = require("gulp-rev");
    gulpHtmlReplace = require('gulp-html-replace'),
    gulpMinifyHTML  = require('gulp-minify-html'),
    gulpPlumber     = require('gulp-plumber'),
    gulpSize        = require('gulp-size'),
    gulpNotify      = require('gulp-notify'),
    gulpLivereload  = require('gulp-livereload'),
    http            = require('http'),
    st              = require('st'),
    del             = require('del');

var paths = {
  scripts: ['./src/js/**/*.js', './lib/**/*.js'],
  styles: ['./src/scss/**.scss'],
  images: './images/**/*'
}

gulp.task('styles', function(callback) {
  gulp.src(paths.styles)
    .pipe(gulpPlumber())
    .pipe(gulpSass())   
    .pipe(gulp.dest('./src/css'))
    .pipe(gulpSize())
    .pipe(gulpNotify("styles completed"))
  callback();
});

gulp.task('concat', function(callback) {
  gulp.src('./src/css/*.css')
    .pipe(gulpPlumber())
    .pipe(gulpSourceMaps.init())  
    .pipe(gulpConcat({path: 'bundle.css', cwd: ''}))
    .pipe(gulp.dest('./build/css/'))
    .pipe(gulpRev())
    .pipe(gulpSourceMaps.write("./"))  
    .pipe(gulp.dest('./build/css/'))
    .pipe(gulpRev.manifest())
    .pipe(gulp.dest('./build/css/'))
    .pipe(gulpSize())
    .pipe(gulpNotify("concat completed"))
    .pipe(gulpLivereload());
  callback();
});

gulp.task('scripts', function(callback) {
  gulp.src(paths.scripts)
    .pipe(gulpPlumber()) 
    .pipe(gulpSourceMaps.init())     
    .pipe(gulpUglify())
    .pipe(gulpConcat({path: 'bundle.js', cwd: ''}))
    .pipe(gulp.dest('./build/js'))
    .pipe(gulpRev())           
    .pipe(gulpSourceMaps.write("./"))  
    .pipe(gulp.dest('./build/js/'))
    .pipe(gulpRev.manifest())
    .pipe(gulp.dest('./build/js'))
    .pipe(gulpSize())
    .pipe(gulpNotify("scripts completed"))
    .pipe(gulpLivereload());
  callback();
});

gulp.task('images', function(callback) {
  gulp.src(paths.images)
    // Pass in options to the task
    .pipe(gulpImageMin({optimizationLevel: 5}))
    .pipe(gulp.dest('build/img'));
});

gulp.task('html-replace', function(callback) {
  var opts = {comments: false, spare: false, quotes: true};
  gulp.src('./src/html/index.html')
    .pipe(gulpPlumber())
    .pipe(gulpHtmlReplace())
    .pipe(gulpMinifyHTML(opts))
    .pipe(gulp.dest('./'))
    .pipe(gulpSize())
    .pipe(gulpNotify("html completed"))
    .pipe(gulpLivereload());
  callback();
});

gulp.task('minify-css', gulp.series('concat', function(callback) {
  gulp.src('./src/css/.css')
    .pipe(gulpPlumber())
    .pipe(gulpCleanCss({
      keepBreaks: true,
    }))
    .pipe(gulpRename(function(path) {
      path.basename += ".min";
      path.extname = ".css";
    }))
    .pipe(gulp.dest('./build/css'))
    .pipe(gulpSize())
    .pipe(gulpNotify("css minify completed"))
    .pipe(gulpLivereload());
  callback();
}));

gulp.task('clean', function(callback) {
  // You can use multiple globbing patterns as you would with `gulp.src`
  return del(['./build'], callback);
});

gulp.task('server', function(callback) {
  http.createServer(
    st({ path: __dirname, index: 'index.html', cache: false })
  ).listen(8080, callback);
});

gulp.task('watch', gulp.parallel('server', function(callback) {
  gulpLivereload.listen();
  gulp.watch('./src/scss/*.scss', gulp.series('styles'));
  gulp.watch('./src/css/*.css', gulp.series('concat'));
  gulp.watch('./src/js/*.js', gulp.series('scripts'));
  gulp.watch('./src/html/*.html', gulp.series('html-replace'));
}));

gulp.task('build', gulp.series('clean', gulp.parallel('scripts', gulp.series('styles', 'concat')), 'html-replace'));

gulp.task('default', gulp.series('build', 'watch'));