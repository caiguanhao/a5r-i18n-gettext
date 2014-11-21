a5r-i18n-gettext
================

gettext for a5r-i18n

```js
gulp.task('gettext', function () {
  var gettext = require('a5r-i18n-gettext');
  return gulp.src('views/**/*.html').pipe(gettext({
    file: 'i18n/dictionary.%code%.json',
    langs: ['zh', 'en']
  })).pipe(gulp.dest('.'));
});
```
