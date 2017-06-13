'use strict';

var _postcss = require('postcss');

var _postcss2 = _interopRequireDefault(_postcss);

var _postcssValueParser = require('postcss-value-parser');

var _postcssValueParser2 = _interopRequireDefault(_postcssValueParser);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _child_process = require('child_process');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _md = require('md5');

var _md2 = _interopRequireDefault(_md);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var cache = [];

var getSketchJSON = function getSketchJSON(file) {

  // Quick Cache...
  var hash = (0, _md2.default)(file);
  if (cache[hash]) return cache[hash];

  var sketchToolLocation = '/Applications/Sketch Beta.app/Contents/Resources/sketchtool/bin/sketchtool';
  if (_fs2.default.existsSync(file)) {
    if (_fs2.default.existsSync(sketchToolLocation)) {
      var cmd = '"' + _path2.default.resolve(sketchToolLocation) + '" dump ' + _path2.default.resolve(file);
      return cache[hash] = JSON.parse((0, _child_process.execSync)(cmd));
    } else {
      throw 'Sketch Tool Not Found: ' + sketchToolLocation;
    }
  } else {
    throw 'Sketch File Not Found: ' + file;
  }
};

/**
 * Converts a Sketch RGBA to HTML5 RGBA
 * @param string
 * @returns {string}
 */
var convRGBA = function convRGBA(string) {
  var x = string.substr(5, string.indexOf(')') - 5).split(',');
  x[0] *= 255;
  x[0] = Math.round(x[0]);
  x[1] *= 255;
  x[1] = Math.round(x[1]);
  x[2] *= 255;
  x[2] = Math.round(x[2]);
  return 'rgba(' + x.join(',') + ')';
};

module.exports = (0, _postcss.plugin)('postcss-backwards', function (opts) {
  opts = opts || {};
  return function (css, result) {

    // Runs through all of the nodes (declorations) in the file
    css.walkDecls(function (declaration) {
      if (declaration.value.indexOf('sketch') !== -1) {

        var parsedValue = (0, _postcssValueParser2.default)(declaration.value);
        if (parsedValue.nodes[1].value.indexOf('.textStyle') == 0) {
          var textStyleName = parsedValue.nodes[1].value.substr(11);

          var file = parsedValue.nodes[0].nodes[0].value;
          var fileRef = _path2.default.join(_path2.default.dirname(declaration.source.input.file), file);

          var sketchData = getSketchJSON(_path2.default.resolve(fileRef));

          var style = _lodash2.default.find(sketchData.layerTextStyles.objects, ['name', textStyleName]);
          if (!style) {
            console.log('Missing style: ' + textStyleName);
          } else {
            // console.log('here', style.value.textStyle );
            if (_lodash2.default.get(style.value, 'textStyle.NSFont.name', false)) {

              // Do the font family & size...
              // TODO - line-height, style etc. px, pt, rem ?
              declaration.value = _lodash2.default.get(style.value, 'textStyle.NSFont.attributes.NSFontSizeAttribute', 10) + 'px \'' + _lodash2.default.get(style.value, 'textStyle.NSFont.name', false) + '\'';

              // Do the font color...
              if (_lodash2.default.has(style.value, 'textStyle.NSColor.color')) {
                var color = _postcss2.default.decl({
                  prop: 'color',
                  value: convRGBA(_lodash2.default.get(style.value, 'textStyle.NSColor.color'))
                });
                declaration.parent.append(color);
              }
            }
          }
        }

        //console.log('File: ' + file);
        //console.log('SketchJSON',style.value );
        // console.log('Deep',parsedValue.nodes[0].nodes);
        //console.log('this', declaration );
      }
      // css.walkRules(rule => {
      //   console.log(rule);
      // })
      // console.log(declaration);
      //declaration.value = declaration.value.split('').reverse().join('');
    });
  };
});