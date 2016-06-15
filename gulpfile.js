var gulp = require('gulp'),
	jade = require('gulp-jade'),
	connect = require('gulp-connect');

gulp.task('connect', function(){
	connect.server({
		port: 1337,
		livereload: true,
		root: './dist'
	})
})

gulp.task('jade', function() {
  return gulp.src('jade/*.jade')
  			.pipe(jade())
  			.pipe(gulp.dest('dist'))
  			.pipe(connect.reload());
});

gulp.task('watch', function(){
	return gulp.watch('jade/*.jade',['jade'])
})

gulp.task('default', ['jade','connect','watch'])