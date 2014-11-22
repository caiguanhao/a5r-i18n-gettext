function readJS (content, funcname) {
  if (typeof content !== 'string') return [];
  if (typeof funcname !== 'string') funcname = undefined;
  funcname = funcname || 'tr';
  var start = -1;
  var end = -1;
  var exprs = [];
  while (
    (start = content.indexOf(funcname)) > -1 &&
    (end = content.indexOf('(', start)) > -1
  ) {
    var func = content.substring(start, end);
    var isTR = 1;
    if (start > 0) {
      var prev = content.substring(start - 1, start);
      if (/[a-zA-Z0-9$_.]/.test(prev)) {
        isTR = 0;
      } else if (prev.charCodeAt(0) > 127) {
        func = prev + func;
      }
    }
    if (isTR == 1) {
      try {
        if (func.indexOf('.') > -1) {
          var parts = func.split('.');
          var parts2 = funcname.split('.');
          var test = 'var ';
          var test2 = '';
          var exp = [];
          for (var i = 0; i < parts.length; i++) {
            var part = parts[i].trim();
            exp.push(part);
            test2 += JSON.stringify(part) + ' == ' +
              JSON.stringify(parts2[i].trim()) + ' && ';
            if (i == parts.length -1) {
              test += exp.join('.') + ' = function () {}; ';
            } else {
              test += exp.join('.') + ' = {}; ';
            }
          }
          test += 'return ' + test2 + 'typeof ' + exp.join('.') +
            ' == "function"';
          var isTR = new Function(test)() ? 1 : 0;
        } else {
          var name = new Function('return function ' + func + ' () {}.name')();
          if (name != funcname) {
            isTR = 0;
          }
        }
      } catch(e) {
        isTR = 0;
      }
    }
    if (isTR == 0) {
      content = content.substring(start + funcname.length);
      continue;
    }
    content = content.substring(end + 1);

    var pa = 0; // parenthesis
    var sq = 0; // single-quote
    var dq = 0; // double-quote
    var bs = 0; // backslash
    var expr = '';
    var closed = 0;
    while (content.length) {
      var cur = content.substring(0, 1);
      if (bs % 2 == 0) {
        if (dq == 0) {
          if (sq == 0 && cur == "'") {
            sq = 1;
          } else if (sq == 1 && cur == "'") {
            sq = 0;
          }
        }
        if (sq == 0) {
          if (dq == 0 && cur == '"') {
            dq = 1;
          } else if (dq == 1 && cur == '"') {
            dq = 0;
          }
        }
      }
      if (sq == 0 && dq == 0) {
        if (pa == 0 && (cur == ')' || cur == ',')) {
          // finish if we have first argument
          closed = 1;
          break;
        }
      }
      if (cur == '(') {
        pa++;
      }
      if (cur == ')') {
        pa--;
        if (pa < 0) pa = 0;
      }
      if (cur == '\\') {
        bs++;
      } else {
        bs = 0;
      }
      expr += cur;
      content = content.substring(1);
    }
    if (closed == 1) {
      exprs.push(expr);
      content = content.substring(1);
    }
  }

  if (exprs.length == 0) return [];
  var strings;
  try {
    strings = new Function('return [' + exprs.join(',') + ']')();
  } catch (e) {
    strings = [];
  }
  strings = strings.map(function (string) {
    return String(string).trim();
  }).filter(function (string) {
    return string.length;
  });
  return strings;
}

module.exports = readJS;
