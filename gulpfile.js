var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var livereload = require('gulp-livereload');

var SCSS_PATH = 'public/css/*.scss';
var DIST_PATH = 'public/dist';

// Styles
gulp.task('styles', function() {
	return gulp.src('public/css/styles.scss')
		.pipe(autoprefixer())
		.pipe(sass({
			outputStyle: 'compressed'
		}))
		.pipe(gulp.dest(DIST_PATH))
		.pipe(livereload());
});

gulp.task('watch', [], function() {
	livereload.listen();
	gulp.watch(SCSS_PATH, ['styles']);
});