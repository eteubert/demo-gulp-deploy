var gulp = require('gulp'),
    bump = require('gulp-bump');
    shell = require('gulp-shell'),
    prompt = require('gulp-prompt'),
    runSequence = require('run-sequence'),
    minimist = require('minimist'),
    fs = require('fs'),
    wp = require('gulp-wp-file-header')()
;

var knownOptions = {
  releaseType: 'patch',
  alias: { 'r': 'releaseType' }
};

var options = minimist(process.argv.slice(2), knownOptions);

function getPackageJsonVersion() {
  return JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
}

gulp.task('git-dist-deploy', function(callback) {
  gulp.src('/')
    .pipe(prompt.prompt([{
      type: 'confirm',
      name: 'task',
      message: 'This will deploy to the Dist Branch. It auto commits and pushes to the master. Sure?'
    }],
     function(res) {
      runSequence(
        'bump-version',
        'update-wp-style-css',
        'deploy-cmd',
        function (error) {
          if (error) {
            console.log(error.message);
          } else {
            console.log('RELEASE FINISHED SUCCESSFULLY: ' + getPackageJsonVersion());
          }
          callback(error);
        });
    }));
});

gulp.task('update-wp-style-css', function(cb) {
  wp.patch();
  cb();
});

gulp.task('bump-version', function() {
  return gulp.src('./package.json')
  .pipe(bump({type: options.releaseType}))
  .pipe(gulp.dest('./'));
});

gulp.task('deploy-cmd', function() {
  return gulp.src('/', {read: false})
    .pipe(shell(
      [
        'git checkout master',
        'git add --all',
        'git commit -m "Auto-Commit for deployment "'+ getPackageJsonVersion(),
        'git tag -a '+ getPackageJsonVersion() + '-dev -m "Version' + getPackageJsonVersion() + '"',
        'git push origin master ' + getPackageJsonVersion() + '-dev',
        'git checkout -B dist',
        'rm .gitignore',
        'mv .gitignore-dist .gitignore',
        'git rm -r --cached .',
        'git add --all',
        'git commit -m "build for release version "' + getPackageJsonVersion(),
        'git tag -a '+ getPackageJsonVersion() + '-dist -m "Version' + getPackageJsonVersion() + '"',
        'git push --force origin dist ' + getPackageJsonVersion() + '-dist',
        'git checkout master',
        'git branch -D dist',
        'echo "Deployed Version: "' + getPackageJsonVersion()
      ]
    , {ignoreErrors: true}));
});

gulp.task('default');