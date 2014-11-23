var fs = require('fs');
var path = require('path');
var extend = require('extend');
var through = require('through2');
var htmlparser = require('htmlparser2');

var readJS = require('./read-js');

function gettext (options) {
  options = options || {};
  options.langs = options.langs || ['en'];
  options.excludeRootKeys = options.excludeRootKeys || [];

  var dictionary = {};

  function add (str) {
    if (typeof str !== 'string') return;
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
          var key = parts[j];
          key = key.replace(/[\n\s]{1,}/g, ' ');
          if (j === l - 1) {
            current[key] = current[key] || '';
          } else {
            current[key] = current[key] || {};
            current = current[key];
          }
        }
      }
    }
  }

  function clean (src) {
    var content = fs.readFileSync(src).toString();
    return JSON.parse(content, function (key, value) {
      if (value === '') return undefined;
      if (typeof value === 'object' && Object.keys(value).length === 0) {
        return undefined;
      }
      return value;
    });
  }

  function readHTML (content, done) {
    var parser = new htmlparser.Parser({
      onopentag: function(name, attribs) {
        if (attribs.i18n) {
          add(attribs.i18n.trim());
        }
      },
      onend: function() {
        if (done) done();
      }
    });
    parser.write(content);
    parser.end();
  }

  function read (file, done) {
    var content = file.contents.toString();
    if (file.path.slice(-3).toLowerCase() === '.js') {
      var ret = readJS(content, 'tr');
      for (var i = 0; i < ret.length; i++) {
        add(ret[i]);
      }
      done();
    } else {
      readHTML(content, done);
    }
  }

  var FILE;
  return through.obj(function (file, enc, cb) {
    if (!FILE) {
      FILE = file.clone();
      delete FILE.contents;
    }
    read(file, cb);
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
          var keys = options.excludeRootKeys;
          for (var j = 0; j < keys.length; j++) {
            delete dictionary[files[i].lang][keys[j]];
          }
          extend(true, dictionary[files[i].lang], clean(files[i].file));
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
