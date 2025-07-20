const gulp = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const del = require("del");

gulp.task("compile-scss", () => {
  return gulp
    .src("public/assets/sass/**/*.scss")
    .pipe(sass().on("error", sass.logError))
    .pipe(gulp.dest("public/assets/css"));
});

gulp.task("clean", () => {
  return del(["./public/assets/css/test.css"]);
});

gulp.task("default", gulp.series(["clean", "compile-scss"]));
