var gulp = require('gulp');
var bump = require('gulp-bump');
var git = require('gulp-git');
var minimist = require('minimist');
var runSequence = require('run-sequence');
var fs = require('fs');
var wp = require('gulp-wp-file-header')('./package.json');
var rm = require( 'gulp-rm' );
var rename = require("gulp-rename");
var excludeGitignore = require('gulp-exclude-gitignore');

var knownOptions = {
  releaseType: 'patch',
  alias: { 'r': 'releaseType' }
};

var options = minimist(process.argv.slice(2), knownOptions);

var settings = {
	branch: {
		dev: "master",
		dist: "dist"
	}
}

function getPackageJsonVersion () {
	return JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
}

gulp.task('ensure-dev-branch', function(cb) {
	git.checkout(settings.branch.dev, function (err) {
		if (err) {
			console.log("unable to checkout", settings.branch.dev, "branch");
			throw err;
		};
	});
	cb();
});

gulp.task('bump-version', function() {
	return gulp.src('./package.json')
	.pipe(bump({type: options.releaseType}))
	.pipe(gulp.dest('./'));
});

gulp.task('update-wp-style-css', function(cb) {
	wp.patch();
	cb();
});

gulp.task('add-changes', function() {
	return gulp.src('./*')
		.pipe(excludeGitignore())
		.pipe(git.add());
});

gulp.task('commit-changes', function () {
	return gulp.src('./*')
		.pipe(excludeGitignore())
		.pipe(git.commit('Auto-Commit for deployment v' + getPackageJsonVersion()));
});

gulp.task('create-new-tag', function (cb) {
	var version = getPackageJsonVersion();
	git.tag(version, 'Created Tag for version: ' + version, function (error) {
		if (error) {
			return cb(error);
		}
		git.push('origin', settings.branch.dev, {args: '--tags'}, cb);
	});
});

gulp.task('push-changes', function (cb) {
	git.push('origin', settings.branch.dev, cb);
});

gulp.task('switch-to-dist-branch', function(cb) {
	git.checkout(settings.branch.dist, {args: '-B'}, function (err) {
		if (err) {
			console.log("unable to checkout", settings.branch.dist, "branch");
			throw err;
		};
		cb();
	});
});

gulp.task('rm-gitignore', function() {
	return gulp.src('.gitignore').pipe(rm());
});

gulp.task('enable-dist-gitignore', function() {
	return gulp.src('.gitignore-dist')
	.pipe(rename('.gitignore'))
	.pipe(gulp.dest('.'));
});

gulp.task('clean-dist-release', function(cb) {
	return gulp.src('.')
		.pipe(git.rm({args: '-r --cached'}));
});

gulp.task('do-dist-release', function(cb) {
	return gulp.src('./*')
		.pipe(excludeGitignore())
		.pipe(git.add());
});

gulp.task('do-dist-release-pt2', function() {
	return gulp.src('./*')
		.pipe(excludeGitignore())
		.pipe(git.commit('build for release version v' + getPackageJsonVersion()))
		.pipe(git.push('origin', settings.branch.dist, {args: '--force'}));
	// git.push('origin', settings.branch.dist, {args: '--force'}, cb);
});

gulp.task('remove-local-dist-branch', function(cb) {
	git.branch(settings.branch.dist, {args: '-D'}, cb);
});

gulp.task('release', function (callback) {
  runSequence(
  	'ensure-dev-branch',
    'bump-version',
    'update-wp-style-css',
    'add-changes',
    'commit-changes',
    'create-new-tag',
    'push-changes',
    'switch-to-dist-branch',
    'rm-gitignore',
    'enable-dist-gitignore',
    'clean-dist-release',
    'do-dist-release',
    'do-dist-release-pt2',
    // 'ensure-dev-branch',
    // 'remove-local-dist-branch',
    function (error) {
      if (error) {
        console.log(error.message);
      } else {
        console.log('RELEASE FINISHED SUCCESSFULLY: ' + getPackageJsonVersion());
      }
      callback(error);
    });
});