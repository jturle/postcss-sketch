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

  // Suppor the non-beta version.
  if (!_fs2.default.existsSync(sketchToolLocation)) sketchToolLocation = '/Applications/Sketch.app/Contents/Resources/sketchtool/bin/sketchtool';

  if (_fs2.default.existsSync(sketchToolLocation)) {
    if (_fs2.default.existsSync(file)) {
      var cmd = '"' + _path2.default.resolve(sketchToolLocation) + '" dump ' + _path2.default.resolve(file);
      return cache[hash] = JSON.parse((0, _child_process.execSync)(cmd));
    } else {
      throw 'Sketch File Not Found: ' + file;
    }
  } else {
    throw 'Sketch Tool Not Found: ' + sketchToolLocation;
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

/**
 * Method to convert units from number in Sketch, to pixel string value...
 * @param unit
 * @returns {string}
 */
var convUnit = function convUnit(unit) {
  return unit + 'px';
};

/**
 * Method to convert units from percent in Sketch, to percent HTML string value...
 * @param unit
 * @returns {string}
 */
var percentUnit = function percentUnit(unit) {
  return Math.round(unit * 100) + '%';
};

module.exports = (0, _postcss.plugin)('postcss-backwards', function (opts) {
  opts = opts || {};
  return function (css, result) {

    // Runs through all of the nodes (declorations) in the file
    css.walkDecls(function (decl) {
      if (decl.value.indexOf('sketch') !== -1) {

        var parsedValue = (0, _postcssValueParser2.default)(decl.value);
        var file = parsedValue.nodes[0].nodes[0].value;
        var fileRef = _path2.default.join(_path2.default.dirname(decl.source.input.file), file);

        if (parsedValue.nodes[1].value.indexOf('.sharedStyle') == 0) {
          var sharedStyleName = parsedValue.nodes[1].value.substr(13);
          var sketchData = getSketchJSON(_path2.default.resolve(fileRef));
          // console.log('symbol time', sketchData.layerStyles);
          var style = _lodash2.default.find(sketchData.layerStyles.objects, ['name', sharedStyleName]);
          if (!style) {
            console.log('Missing shared style: ' + sharedStyleName);
          } else {

            // Do the font color...
            if (_lodash2.default.has(style.value, 'contextSettings.opacity') && _lodash2.default.get(style.value, 'contextSettings.opacity', 1) < 1) {
              decl.cloneBefore({
                prop: 'opacity',
                value: _lodash2.default.get(style.value, 'contextSettings.opacity', 1)
              });
            }

            // Do the background...
            var fill = _lodash2.default.find(style.value.fills, ['isEnabled', 1]);
            if (fill) {

              if (fill.fillType == 0) {
                // Background-color
                decl.cloneBefore({
                  prop: 'background-color',
                  value: _lodash2.default.get(fill, 'color.value')
                });
              }

              if (fill.fillType == 1) {
                // Gradient
                var gradRule = void 0;
                switch (fill.gradient.gradientType) {
                  case 0:
                    gradRule = 'linear-gradient(90deg, ';
                    break;
                  case 1:
                    console.log('Radial', fill);
                    /* Rectangle:
                    background-image: radial-gradient(26% 71%, #3023AE 17%, #C96DD8 85%);*/
                    gradRule = 'radial-gradient(' + percentUnit(fill.gradient.from.x) + ' ' + percentUnit(fill.gradient.to.y) + ', ';
                    break;
                }
                fill.gradient.stops.forEach(function (stop, idx) {
                  if (fill.gradient.gradientType == 1) console.log(stop);
                  if (idx > 0) gradRule += ', ';
                  gradRule += stop.color.value + ' ' + Math.round(stop.position * 100) + '%';
                });
                gradRule += ')';
                decl.cloneBefore({
                  prop: 'background-image',
                  value: gradRule
                });
              }
            }

            // Do the border...
            var border = _lodash2.default.find(style.value.borders, ['isEnabled', 1]);
            if (border) {
              decl.cloneBefore({
                prop: 'border',
                value: _lodash2.default.get(border, 'thickness') + 'px solid ' + _lodash2.default.get(border, 'color.value')
              });
            }

            // Do the box shadow...
            var shadow = _lodash2.default.find(style.value.shadows, ['isEnabled', 1]);
            if (shadow) {
              var shadowRule = convUnit(shadow.offsetX);
              shadowRule += ' ' + convUnit(shadow.offsetY);
              shadowRule += ' ' + convUnit(shadow.blurRadius);
              shadowRule += ' ' + convUnit(shadow.spread);
              shadowRule += ' ' + shadow.color.value;
              decl.cloneBefore({
                prop: 'box-shadow',
                value: shadowRule
              });
            }

            // Finally remove it...
            decl.remove();
          }
        }
        if (parsedValue.nodes[1].value.indexOf('.textStyle') == 0) {
          var textStyleName = parsedValue.nodes[1].value.substr(11);

          var _sketchData = getSketchJSON(_path2.default.resolve(fileRef));

          var _style = _lodash2.default.find(_sketchData.layerTextStyles.objects, ['name', textStyleName]);
          if (!_style) {
            console.log('Missing text style: ' + textStyleName);
          } else {
            // console.log('here', style.value.textStyle );
            if (_lodash2.default.get(_style.value, 'textStyle.NSFont.family', false)) {

              // Do the font family & size...
              // TODO - line-height, style etc. px, pt, rem ?
              decl.value = _lodash2.default.get(_style.value, 'textStyle.NSFont.attributes.NSFontSizeAttribute', 10) + 'px \'' + _lodash2.default.get(_style.value, 'textStyle.NSFont.family', false) + '\'';

              // Do the font color...
              if (_lodash2.default.has(_style.value, 'textStyle.NSColor.color')) {
                var color = _postcss2.default.decl({
                  prop: 'color',
                  value: convRGBA(_lodash2.default.get(_style.value, 'textStyle.NSColor.color'))
                });
                decl.parent.append(color);
              }
            }
          }
        }

        //console.log('File: ' + file);
        //console.log('SketchJSON',style.value );
        // console.log('Deep',parsedValue.nodes[0].nodes);
        //console.log('this', decl );
      }
      // css.walkRules(rule => {
      //   console.log(rule);
      // })
      // console.log(decl);
      //decl.value = decl.value.split('').reverse().join('');
    });
  };
});