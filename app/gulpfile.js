const gulp = require('gulp');
const nodemon = require('gulp-nodemon');
const tsc = require('gulp-typescript');
const tslint = require('gulp-tslint');
const sourcemaps = require('gulp-sourcemaps');

const srcGlob = ['src/**/*.ts'];
const tsProject = tsc.createProject('./tsconfig.json');
const srcGlobTslint = ['src/**/*.ts', '!src/**/*.d.ts'];
const tsLintConfig = './tslint.json';

/*
 * Starts dev environment: watch over .ts files and run default
 */
gulp.task('start', () => {
  return nodemon({
    script: 'src/app.js',
    watch: srcGlob,
    nodeArgs: ['--inspect=0.0.0.0:5858'], // args used for attaching to a debugger
    ignore: ['**/*.js', '**/*.d.ts'],
    ext: 'ts',
    tasks: ['default']
  });
});

/*
 * Compile TypeScript
 */
gulp.task('tsc', () => {
  return gulp.src(srcGlob)
    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('src'));
});

/*
 * Lint TypeScript
 */
gulp.task('tslint', () => {
  return gulp.src(srcGlobTslint)
    .pipe(tslint({ configuration: tsLintConfig }))
    .pipe(tslint.report())
});

/*
 * Run tasks asynchronously
 */
gulp.task('default', ['tslint', 'tsc']);
