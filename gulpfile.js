var gulp = require('gulp'),
    shell = require('gulp-shell'),
    prompt = require('gulp-prompt'),
    wp = require('gulp-wp-file-header')(),
    p = require('./package.json');


gulp.task('git-dist-deploy', function() {
    gulp.src('/')
      .pipe(prompt.prompt([{
        type: 'confirm',
        name: 'task',
        message: 'This will deploy to the Dist Branch. It auto commits and pushes to the master. Sure?'
      },
      {
        type: 'confirm',
        name: 'version',
        message: 'Have you setup the current release version in package.json?'
      }],
       function(res) {
        if (res.task) {
            if(res.version == false){
              console.log("go figure!");
            }
            else{
              //Run the build and deploy task
              gulp.start('deploy-cmd');
              //Patch the style.css to the current version from package.json
              wp.patch();
            }


        } else {
          console.log('Ok. Go do something else first.');
        }
      }));
  });

  gulp.task('deploy-cmd', shell.task([
    'git checkout master',
    'git add --all',
    'git commit -m "Auto-Commit for deployment "'+ p.version,
    'git tag -a '+ p.version + '-dev -m "Version' + p.version + '"',
    'git push origin master ' + p.version + '-dev',
    'git checkout -B dist',
    'rm .gitignore',
    'mv .gitignore-dist .gitignore',
    'git rm -r --cached .',
    'git add --all',
    'git commit -m "build for release version "' + p.version,
    'git tag -a '+ p.version + '-dist -m "Version' + p.version + '"',
    'git push --force origin dist ' + p.version + '-dist',
    'git checkout master',
    'git branch -D dist',
    'echo "Deployed Version: "' + p.version
  ], {
    ignoreErrors: true
  }));

gulp.task('default');