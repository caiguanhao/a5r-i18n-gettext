var fs = require('fs');
var path = require('path');
var extend = require('extend');
var through = require('through2');
var htmlparser = require('htmlparser2');

function gettext (options) {
  options = options || {};
  options.langs = options.langs || ['en'];

  var dictionary = {};

  function add (str) {
    if (typeof str !== 'string') return;
    str = str.trim();
    if (str[0] === '{') {
      var object;
      try {
        var expr = new Function('return ' + str);
        object = expr();
      } catch (e) {}
      if (typeof object === 'object') {
        for (var key in object) {
          add(object[key]);
        }
        return;
      }
    }
    if (str) {
      var parts = str.split('::');
      var l = parts.length;
      for (var i = 0; i < options.langs.length; i++) {
        dictionary[options.langs[i]] = dictionary[options.langs[i]] || {};
        var current = dictionary[options.langs[i]];
        for (var j = 0; j < l; j++) {
          if (j === l - 1) {
            current[parts[j]] = current[parts[j]] || '';
          } else {
            current[parts[j]] = current[parts[j]] || {};
            current = current[parts[j]];
          }
        }
      }
    }
  }

  function read (content, done) {
    var parser = new htmlparser.Parser({
      onopentag: function(name, attribs) {
        add(attribs.i18n);
      },
      onend: function() {
        if (done) done();
      }
    });
    parser.write(content);
    parser.end();
  }

  var FILE;
  return through.obj(function (file, enc, cb) {
    if (!FILE) {
      FILE = file.clone();
      delete FILE.contents;
    }
    read(file.contents.toString(), cb);
  }, function (cb) {
    if (FILE) {
      if (options.file) {
        FILE.base = FILE.cwd;
        FILE.path = path.join(FILE.cwd, options.file);
      }
      var files = options.langs.map(function (lang) {
        return {
          lang: lang,
          file: FILE.path.replace(/%code%/g, lang)
        };
      });
      for (var i = 0; i < files.length; i++) {
        try {
          extend(true, dictionary[files[i].lang], require(files[i].file));
        } catch (e) {}
        var content = JSON.stringify(dictionary[files[i].lang], undefined, 2);
        var file = FILE.clone();
        file.path = files[i].file;
        file.contents = new Buffer(content + '\n');
        this.push(file);
      }
    }
    cb();
  });
}

module.exports = gettext;
