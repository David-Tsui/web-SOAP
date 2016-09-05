var gulp     = require('gulp');
var $plugins = require('gulp-load-plugins')();
var http     = require('http');
var st       = require('st');
var path     = require('path');
var bourbon  = require("bourbon").includePaths;
// var Q    = require('q');

var paths = {
	PASS	 : './',
	src : {
		base	 : 'src',
		scripts: ['src/javascripts/*.js', 'src/javascripts/vendor/*.js'],
		styles : {
			scss: 'src/stylesheets/scss/',
			css : 'src/stylesheets/css/'
		}
	},
	assets: {
		images : 'assets/images/**/*',
		json   : 'assets/resources/*.json',
	},
	dist : {
		base   : 'dist',
		html   : 'src/tmp',
		scripts: 'dist/scripts',
		styles : 'dist/styles',
		assets : 'dist/assets'
	}
}

gulp.task('clean', function(callback) {
	gulp.src(path.join(paths.dist.base, "/**/*"), {read: false})
		.pipe($plugins.clean());
	callback();
});

gulp.task('clean-html', function(callback) {
	gulp.src([path.join(paths.dist.html, '/*.html'), path.join(paths.dist.base, "/index.html")], {read: false})
		.pipe($plugins.clean());
	callback();
});

gulp.task('clean-js', function(callback) {
	gulp.src(path.join(paths.dist.scripts, '/*'), {read: false})
		.pipe($plugins.clean());
	callback();
});

gulp.task('clean-css', function(callback) {
	gulp.src(path.join(paths.dist.styles, '/*'), {read: false})
		.pipe($plugins.clean());
	callback();
});

gulp.task('clean-css-src', function(callback) {
	gulp.src([
		path.join(paths.src.styles.css, '/*.css'),
		path.join('!' + paths.src.styles.css, '/vendor/*.css')
	], {read: false})
		.pipe($plugins.clean());
	callback();
});

gulp.task('scss', gulp.parallel(
	function scss_custom(callback) {
		gulp.src(path.join(paths.src.styles.scss, "/*.scss"))
			.pipe($plugins.plumber())
			.pipe($plugins.sass({
				includePaths: ["scss"].concat(bourbon)
			}))   
			.pipe(gulp.dest(paths.src.styles.css))
			// .pipe($plugins.notify("scss to css completed"))
		callback();
	},
	function scss_vendor(callback) {
		gulp.src(path.join(paths.src.styles.scss, "/vendor/*.scss"))
			.pipe($plugins.plumber())
			.pipe($plugins.sass())   
			.pipe(gulp.dest(path.join(paths.src.styles.css, "/vendor")))
		callback();
	}
));

gulp.task('minify-css', function(callback) {
	setTimeout(function() {
		gulp.src([
			path.join(paths.src.styles.css, '/*.css'),
			path.join('!' + paths.src.styles.css, '/*.min.css'),
			path.join(paths.src.styles.css, '/vendor/*.css'),
			path.join('!' + paths.src.styles.css, '/vendor/*.min.css')
			])
			.pipe($plugins.plumber())
			.pipe($plugins.cleanCss({
				keepBreaks: true,
			}))
			.pipe($plugins.rename(function(path) {
				path.basename += ".min";
				path.extname  = ".css";
			}))
			.pipe(gulp.dest(paths.src.styles.css))
			// .pipe($plugins.notify("css minify completed"))
		callback();
	}, 350);
});

gulp.task('styles', gulp.series('clean-css', 'scss', 'minify-css', function concat_minify_css(callback) {
	setTimeout(function() {
		gulp.src([
			path.join(paths.src.styles.css, '/*.css'),
			path.join(paths.src.styles.css, '/vendor/*.min.css')
		])
		.pipe($plugins.plumber())
		.pipe($plugins.sourcemaps.init())
		.pipe($plugins.concat({path: 'bundle.min.css', cwd: ''}))
		.pipe(gulp.dest(paths.dist.styles))
		.pipe($plugins.rev())
		.pipe($plugins.sourcemaps.write("./"))  
		.pipe(gulp.dest(paths.dist.styles))
		.pipe($plugins.rev.manifest({
			path : path.join(paths.dist.base, '/manifest.json'),
			merge: true
		}))
			// .pipe($plugins.debug({title: 'Styles:', minimal: false}))
			.pipe(gulp.dest("./"))
			.pipe($plugins.notify("CSS is ready..."));
			// .pipe($plugins.livereload());
		callback();
	}, 350);
}));

gulp.task('scripts', gulp.series('clean-js', function(callback) {
	setTimeout(function() {
		gulp.src(paths.src.scripts)
			.pipe($plugins.plumber())
			.pipe($plugins.sourcemaps.init())     
			.pipe($plugins.uglify())
			.pipe($plugins.concat({path: 'bundle.min.js', cwd: ''}))
			.pipe(gulp.dest(paths.dist.scripts))
			.pipe($plugins.rev())           
			.pipe($plugins.sourcemaps.write("./"))  
			.pipe(gulp.dest(paths.dist.scripts))
			.pipe($plugins.rev.manifest({
				path : path.join(paths.dist.base, '/manifest.json'),
				merge: true
			}))
			// .pipe($plugins.debug({title: 'Styles:', minimal: false}))
			.pipe(gulp.dest("./"))
			.pipe($plugins.notify("JS is ready..."));
			// .pipe($plugins.livereload());
		callback();
	}, 350);
}));

gulp.task('images', function(callback) {
	gulp.src(paths.assets.images)
		.pipe($plugins.imagemin({optimizationLevel: 5}))
		.pipe(gulp.dest(path.join(paths.dist.assets, "/images")))
		// .pipe($plugins.livereload());
	callback();
});

gulp.task('json', function(callback) {
	gulp.src(paths.assets.json)
		.pipe(gulp.dest(path.join(paths.dist.assets, "/resources")));
	callback();
})

gulp.task('assets', gulp.series(gulp.parallel('images', 'json'), function(callback) {
	gulp.src(paths.PASS, {read: false})
		.pipe($plugins.notify("Assets is ready..."));
	callback();
}));

gulp.task('html_inject', function(callback) {
	setTimeout(function() {
		var injectStyles  = gulp.src(path.join(paths.dist.styles, '/bundle.min.css'), { read: false });
		var injectScripts = gulp.src(path.join(paths.dist.scripts, '/bundle.min.js'), { read: false });
		var injectOptions = {
			ignorePath  : paths.dist.base,
			addRootSlash: false
		};
		gulp.src(path.join(paths.src.base, '/index.html'))
			.pipe($plugins.inject(injectStyles, injectOptions))
			.pipe($plugins.inject(injectScripts, injectOptions))
			.pipe(gulp.dest(paths.dist.html));
		callback();
	}, 350);
});

gulp.task('html_replace', function(callback) {
	setTimeout(function() {
		var opts = {comments: false, spare: false, quotes: true};
		var manifest = gulp.src(path.join(paths.dist.base, "/manifest.json"));
		gulp.src(path.join(paths.dist.html, '/index.html'))
			.pipe($plugins.plumber())
			.pipe($plugins.revReplace({manifest: manifest}))
			.pipe($plugins.debug({title: 'Replace:', minimal: false}))
			.pipe($plugins.htmlReplace())
			.pipe($plugins.minifyHtml(opts))
			.pipe(gulp.dest(paths.dist.base))
			.pipe($plugins.livereload())
			.pipe($plugins.notify("Index is ready..."));
		callback();
	}, 350);
});

// gulp.task('html_reload', function(callback) {
// 	gulp.src(path.join(paths.dist.html, '/index.html'))
// 		.pipe($plugins.plumber())
// 		.pipe($plugins.notify("Index has reloaded"))
// 		.pipe($plugins.livereload());
// 	callback();
// });

gulp.task('html', gulp.series('html_inject', 'html_replace'));

gulp.task('server', function(callback) {
	var port = 8080;
	http.createServer(
		st({ path: paths.dist.base, index: 'index.html', cache: false })
	).listen(port, callback);
	gulp.src(paths.PASS, {read: false})
		.pipe($plugins.notify("Serving port " + port));
});

gulp.task('watch', function(callback) {
	$plugins.livereload.listen();
	gulp.watch(paths.src.styles.scss,  gulp.series('clean-css', 'styles', 'html'));
	gulp.watch(paths.src.scripts, gulp.series('clean-js', 'scripts', 'html'));
	gulp.watch(path.join(paths.src.base, "/index.html"), gulp.series('html'));
	// gulp.watch(path.join(paths.dist.base, "/index.html"), gulp.series('html_reload'));
	callback();
});

gulp.task('build', gulp.series(gulp.parallel('clean-css', 'clean-js'), 'styles', 'scripts', 'html'),
	function done(callback) {
		gulp.src(paths.PASS, {read: false})
			.pipe($plugins.notify("Build completed!!!"));
		callback();
	}
);
gulp.task('default', gulp.parallel('watch', 'server'));