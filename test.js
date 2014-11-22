var readJS = require('./read-js');
var expect = require('chai').expect;

function multiline (func) {
  return func.toString().match(/\/\*!?([\S\s]*?)\*\//)[1].trim();
}

function makeTest (results, asExpected) {
  return function () {
    if (asExpected.length === 0) {
      expect(results).to.be.an('array').and.have.length(0);
    } else {
      expect(results).to.have.members(asExpected);
    }
  };
}

describe('gettext of js files', function () {
  describe('when function name is tr', function () {
    var tests = {
      "tr('')": [],
      "tr(' ')": [],
      "tr()": [],
      "tr('s')": ['s'],
      "tr('s' + 's')": ['ss'],
      "tr('1' + '2' + '3')": ['123'],
      "tr(1 + 2 + 3)": ['6'],
      "tr(')')": [')'],
      'tr(")")': [')'],
      "tr('\")')": ['")'],
      'tr("\\")")': ['")'],
      'tr("\\\")")': ['")'],
      'tr("\\\\")")': ['\\'],
      'tr("\\\\\")")': ['\\'],
      'tr("\\\\\\")")': ['\\")'],
      'tr("\')")': ["')"],
      "tr('\\')')": ['\')'],
      "tr('\\\')')": ['\')'],
      "tr('\\\\')')": ['\\'],
      "tr('\\\\\')')": ['\\'],
      "tr('\\\\\\')')": ['\\\')'],
      "tr('a')tr('b')": ['a', 'b'],
      "btr('a')tr('b')": ['b'],
      "tr('a')btr('b')": ['a'],
      "tr(": [],
      "tr('a'": [],
      "tr('a'x)": [],
      " tr('a')": ['a'],
      " tr ( 'a' ) ": ['a'],
      ";tr('a')": ['a'],
      ";tr;('a')": [],
      "str('a')": [],
      "_tr('a')": [],
      ".tr('a')": [],
      "$tr('a')": [],
      "πtr('a')": [],
      "tr(('a' + 'b') + 'c')": ['abc'],
      "(true)('a')": [],
      "try('a')": [],
      "(tr('a'))": ['a'],
      "(tr   ('a'))": ['a'],
    };

    tests[multiline(function () {/*
      tr('te' +
      'st')
    */})] = ['test'];

    tests[multiline(function () {/*
      ;tr (('t' + 'e') +
      ('s' + 't'))
    */})] = ['test'];

    for (var key in tests) {
      it('"' + key + '" should equal to ' + JSON.stringify(tests[key]),
        makeTest(readJS(key), tests[key]));
    }
  });

  describe('when function name is _____', function () {
    var tests = {
      " _____ (('a') + ('b' + 'c'))": ['abc'],
      ";_____('a')": ['a'],
      ";_____;('a')": [],
      "s_____('a')": [],
      "______('a')": [],
      "._____('a')": [],
      "$_____('a')": [],
      "π_____('a')": [],
      "_____$('a')": [],
    };

    for (var key in tests) {
      it('"' + key + '" should equal to ' + JSON.stringify(tests[key]),
        makeTest(readJS(key, '_____'), tests[key]));
    }
  });

  describe('when function name is $scope.i18n.translate', function () {
    var tests = {
      " $scope.i18n.translate (('a') + ('b' + 'c'))": ['abc'],
      ";$scope.i18n.translate('a')": ['a'],
      ";$scope.i18n.translate;('a')": [],
      "s$scope.i18n.translate('a')": [],
      "_$scope.i18n.translate('a')": [],
      ".$scope.i18n.translate('a')": [],
      "$$scope.i18n.translate('a')": [],
      "π$scope.i18n.translate('a')": [],
      "$scope.i18n.translated('a')": [],
    };

    for (var key in tests) {
      it('"' + key + '" should equal to ' + JSON.stringify(tests[key]),
        makeTest(readJS(key, '$scope.i18n.translate'), tests[key]));
    }
  });
});
