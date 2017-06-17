'use strict';

var _postcss = require('postcss');

var _postcss2 = _interopRequireDefault(_postcss);

var _postcssValueParser = require('postcss-value-parser');

var _postcssValueParser2 = _interopRequireDefault(_postcssValueParser);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _child_process = require('child_process');

var _path2 = require('path');

var _path3 = _interopRequireDefault(_path2);

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
      var cmd = '"' + _path3.default.resolve(sketchToolLocation) + '" dump ' + _path3.default.resolve(file);
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
  if (x[3]) {
    x[3] = Math.round(x[3] * 100) / 100;
  }
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

var extractBackground = function extractBackground(fill) {
  if (fill.fillType == 0) {
    // Background-color
    return {
      prop: 'background-color',
      value: _lodash2.default.get(fill, 'color.value')
    };
  }

  if (fill.fillType == 1) {
    // Gradient
    var gradRule = void 0;
    switch (fill.gradient.gradientType) {
      case 0:
        gradRule = 'linear-gradient(0deg, ';
        break;
      case 1:
        // console.log('Radial', fill );
        /* Rectangle:
         background-image: radial-gradient(26% 71%, #3023AE 17%, #C96DD8 85%);*/
        gradRule = 'radial-gradient(' + percentUnit(fill.gradient.from.x) + ' ' + percentUnit(fill.gradient.to.y) + ', ';
        break;
    }
    fill.gradient.stops.forEach(function (stop, idx) {
      // if( fill.gradient.gradientType == 1 )
      //console.log(stop);
      if (idx > 0) gradRule += ', ';
      gradRule += stop.color.value + ' ' + Math.round(stop.position * 100) + '%';
    });
    gradRule += ')';
    return {
      prop: 'background-image',
      value: gradRule
    };
  }

  return { prop: 'background', value: 'transparent' };
};

var extractBorder = function extractBorder(border) {
  return {
    prop: 'border',
    value: convUnit(_lodash2.default.get(border, 'thickness')) + ' solid ' + _lodash2.default.get(border, 'color.value')
  };
};

var sketchLayerToMixed = function sketchLayerToMixed(layer, parent) {
  var nest = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

  // parent.append({prop: '-ref', value: layer.name});
  if (layer.hasBackgroundColor && layer.includeBackgroundColorInExport) {
    parent.append({ prop: 'background-color', value: layer.backgroundColor.value });
  } else {
    // Background/Fills
    if (layer.style && layer.style.fills.length && _lodash2.default.find(layer.style.fills, ['isEnabled', 1])) {
      parent.append(extractBackground(_lodash2.default.find(layer.style.fills, ['isEnabled', 1])));
    }
  }
  if (nest && layer.layers) {
    layer.layers.forEach(function (childLayer) {
      if (['text', 'container'].indexOf(childLayer.name) == -1) {
        var newParent = parent.cloneBefore();
        newParent.removeAll();
        newParent.selector += ' :global(.' + childLayer.name + ')';
        sketchLayerToMixed(childLayer, newParent);
      }
      if (childLayer.name == 'text' || childLayer.name == 'container') sketchLayerToMixed(childLayer, parent);
    });
  }

  // Font color
  if (layer.style && layer.style.textStyle) {
    parent.append({ prop: 'color', value: convRGBA(layer.style.textStyle.NSColor.color) });
  }

  // Borders
  if (layer.style && layer.style.borders.length && _lodash2.default.find(layer.style.borders, ['isEnabled', 1])) {
    parent.append(extractBorder(_lodash2.default.find(layer.style.borders, ['isEnabled', 1])));
  }

  // Radius
  if (_lodash2.default.find(layer.layers, ['name', 'Path'])) {
    var _path = _lodash2.default.find(layer.layers, ['name', 'Path']);
    if (_path.fixedRadius) parent.append({ prop: 'border-radius', value: convUnit(_path.fixedRadius) });
  }
};

module.exports = (0, _postcss.plugin)('postcss-backwards', function (opts) {
  opts = opts || {};
  return function (css, result) {

    // Clear cache every run
    cache = [];

    var addedDep = false;

    // Runs through all of the nodes (declorations) in the file
    css.walkDecls(function (decl) {
      if (decl.value.indexOf('sketch(') !== -1) {
        var parsedValue = (0, _postcssValueParser2.default)(decl.value);

        var file = parsedValue.nodes[0].nodes[0].value;

        // Resolve the file reference.
        var fileRef = _path3.default.join(_path3.default.dirname(decl.source.input.file), file);

        // Retrieve the sketch JSON dump
        var sketchData = getSketchJSON(_path3.default.resolve(fileRef));

        // Add a dependency.
        if (!addedDep) {
          result.messages.push({ type: 'dependency', file: fileRef, parent: css.source.input.file });
          addedDep = true;
        }

        // Symbols
        if (parsedValue.nodes[1].value.indexOf('.symbolDeep') == 0) {
          var symbolName = parsedValue.nodes[1].value.substr(12);
          var symbols = _lodash2.default.find(sketchData.pages, ['name', 'Symbols']);
          var symbol = _lodash2.default.find(symbols.layers, ['name', symbolName]);
          //console.log(symbols);
          if (!symbol) {
            console.log('Missing symbol: ' + symbolName);
          } else {
            sketchLayerToMixed(symbol, decl.parent);
            // Finally remove it...
            decl.remove();
          }
        }

        // Symbols
        if (parsedValue.nodes[1].value.indexOf('.symbol') == 0) {
          var _symbolName = parsedValue.nodes[1].value.substr(8);
          var _symbols = _lodash2.default.find(sketchData.pages, ['name', 'Symbols']);
          var _symbol = _lodash2.default.find(_symbols.layers, ['name', _symbolName]);
          //console.log(symbols);
          if (!_symbol) {
            console.log('Missing symbol: ' + _symbolName);
          } else {
            sketchLayerToMixed(_symbol, decl.parent, false);
            // Finally remove it...
            decl.remove();
          }
        }

        // Shared Styles
        if (parsedValue.nodes[1].value.indexOf('.sharedStyle') == 0) {
          var sharedStyleName = parsedValue.nodes[1].value.substr(13);
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
                    // console.log('Radial', fill );
                    /* Rectangle:
                     background-image: radial-gradient(26% 71%, #3023AE 17%, #C96DD8 85%);*/
                    gradRule = 'radial-gradient(' + percentUnit(fill.gradient.from.x) + ' ' + percentUnit(fill.gradient.to.y) + ', ';
                    break;
                }
                fill.gradient.stops.forEach(function (stop, idx) {
                  // if( fill.gradient.gradientType == 1 )
                  //console.log(stop);
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

        // Text Styles...
        if (parsedValue.nodes[1].value.indexOf('.textStyle') == 0) {
          var textStyleName = parsedValue.nodes[1].value.substr(11);
          var _style = _lodash2.default.find(sketchData.layerTextStyles.objects, ['name', textStyleName]);
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
      }
    });
  };
});