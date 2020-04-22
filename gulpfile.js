// gulpfile.js
var path = require('path');
var gulp = require('gulp');
var browserify = require('browserify');
var babelify = require('babelify');
var glob = require('glob');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var es = require('event-stream');

gulp.task('build', (done) => {
    glob('lib/examples/*.js', function(err, files) {
        if(err) done(err);

        es.merge(files.map(entry => {
            return browserify([entry])
//                .transform(babelify, {presets: ["@babel/preset-env"], plugins: ["@babel/plugin-transform-runtime"],sourceMapsAbsolute: true})
                .bundle()
                .pipe(source(path.basename(entry)))
                .pipe(gulp.dest('examples'))
                .pipe(buffer());     // You need this if you want to continue using the stream with other plugins
        })).on('end', done);
    });
});

//Default task. This will be run when no task is passed in arguments to gulp
gulp.task("default", gulp.series('build'));
