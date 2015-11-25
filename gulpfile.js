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
var version = '';

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
        'memorize-version',
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

gulp.task('memorize-version', function(cb) {
  version = JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
  console.log("memorize", version);
  cb();
});

gulp.task('update-wp-style-css', function(cb) {
  wp.patch();
  cb();
});

gulp.task('bump-version', function(cb) {
  gulp.src('./package.json')
  .pipe(bump({type: options.releaseType}))
  .pipe(gulp.dest('./'));
  cb();
});

gulp.task('deploy-cmd', shell.task([
  'git checkout master',
  'git add --all',
  'git commit -m "Auto-Commit for deployment "'+ version,
  'git tag -a '+ version + '-dev -m "Version' + version + '"',
  'git push origin master ' + version + '-dev',
  'git checkout -B dist',
  'rm .gitignore',
  'mv .gitignore-dist .gitignore',
  'git rm -r --cached .',
  'git add --all',
  'git commit -m "build for release version "' + version,
  'git tag -a '+ version + '-dist -m "Version' + version + '"',
  'git push --force origin dist ' + version + '-dist',
  'git checkout master',
  'git branch -D dist',
  'echo "Deployed Version: "' + version
], {
  ignoreErrors: true
}));

gulp.task('default');