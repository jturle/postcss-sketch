'use strict';

var _postcss = require('postcss');

var _postcss2 = _interopRequireDefault(_postcss);

var _postcssValueParser = require('postcss-value-parser');

var _postcssValueParser2 = _interopRequireDefault(_postcssValueParser);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _path2 = require('path');

var _path3 = _interopRequireDefault(_path2);

var _helpers = require('./helpers');

var _loader = require('./loader');

var _parsers = require('./parsers');

var parser = _interopRequireWildcard(_parsers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var sketchLayerToMixed = function sketchLayerToMixed(layer, parent) {
  var nest = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  var parentLayer = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

  if (layer.hasBackgroundColor && layer.includeBackgroundColorInExport) {
    parent.append({ prop: 'background-color', value: layer.backgroundColor.value });
  } else {
    // Background/Fills
    if (layer.style && layer.style.fills.length && _lodash2.default.find(layer.style.fills, ['isEnabled', 1])) {
      parent.append(parser.extractBackground(_lodash2.default.find(layer.style.fills, ['isEnabled', 1])));
    }
  }

  if (nest && layer.layers) {
    layer.layers.forEach(function (childLayer) {
      if (['text', 'container', 'Path'].indexOf(childLayer.name) == -1) {
        var newParent = parent.cloneBefore();
        newParent.removeAll();
        newParent.selector += ' :global(.' + childLayer.name + ')';
        sketchLayerToMixed(childLayer, newParent, nest, layer);
      }
      var boundingLayer = _lodash2.default.find(layer.layers, ['name', 'container']) || layer;
      console.log('BoundingLayer', boundingLayer.name);
      if (childLayer.name == 'container') sketchLayerToMixed(childLayer, parent, nest, layer);
      if (childLayer.name == 'text') sketchLayerToMixed(childLayer, parent, nest, boundingLayer);
    });
  }

  // Frame
  var resizingConstraint = layer.resizingConstraint;
  var shape = layer.frame;
  parent.append({ prop: 'box-sizing', value: 'border-box' });
  var FLAG_A = 1; // 0001
  var FLAG_B = 2; // 0010
  var FLAG_C = 4; // 0100
  var FLAG_D = 8; // 1000
  var FLAG_E = 16; // 0100
  var FLAG_F = 32; // 1000
  var FLAG_G = 64; // 1000
  if (layer.name == 'text') {
    // console.log('nl');
    // console.log('FLAG A RIGHT ON', FLAG_A & resizingConstraint);
    // console.log('FLAG B LOCK WIDTH', FLAG_B & resizingConstraint);
    // console.log('FLAG C LEFT ON', FLAG_C & resizingConstraint);
    // console.log('FLAG D DOWN ON', FLAG_D & resizingConstraint);
    // console.log('FLAG E LOCK HEIGHT', FLAG_E & resizingConstraint);
    // console.log('FLAG F TOP ON', FLAG_F & resizingConstraint);
    // console.log('FLAG G TOP & BOT', FLAG_G & resizingConstraint);
    if ((resizingConstraint & FLAG_C) == 0) parent.append({ prop: 'padding-left', value: (0, _helpers.convUnit)(layer.frame.x - parentLayer.frame.x) });
    if ((resizingConstraint & FLAG_F) == 0) parent.append({ prop: 'padding-top', value: (0, _helpers.convUnit)(layer.frame.y - parentLayer.frame.y) });
    if ((resizingConstraint & FLAG_D) == 0) {
      parent.append({
        prop: 'padding-bottom',
        value: (0, _helpers.convUnit)(parentLayer.frame.y + parentLayer.frame.height - layer.frame.y - layer.frame.height)
      });
    }
    if ((resizingConstraint & FLAG_A) == 0) {
      parent.append({
        prop: 'padding-right',
        value: (0, _helpers.convUnit)(parentLayer.frame.x + parentLayer.frame.width - layer.frame.x - layer.frame.width)
      });
    }
  }
  if (layer.name == 'container') {
    if ((resizingConstraint & FLAG_B) == 0) parent.append({ prop: 'width', value: (0, _helpers.convUnit)(layer.frame.width) });
    if ((resizingConstraint & FLAG_E) == 0) parent.append({ prop: 'height', value: (0, _helpers.convUnit)(layer.frame.height) });

    // Margins
    if (layer.frame.x !== 0) parent.append({ prop: 'margin-left', value: (0, _helpers.convUnit)(layer.frame.x) });
    if (layer.frame.y !== 0) parent.append({ prop: 'margin-top', value: (0, _helpers.convUnit)(layer.frame.y) });
    var marginRight = parentLayer.frame.width - layer.frame.x - layer.frame.width;
    if (marginRight !== 0) parent.append({ prop: 'margin-right', value: (0, _helpers.convUnit)(marginRight) });
    var marginBottom = parentLayer.frame.height - layer.frame.y - layer.frame.height;
    if (marginBottom !== 0) parent.append({ prop: 'margin-bottom', value: (0, _helpers.convUnit)(marginBottom) });
  }

  // Font color
  if (layer.style && layer.style.textStyle) {
    var alignment = layer.style.textStyle.NSParagraphStyle.style.alignment;
    switch (alignment) {
      case 1:
        parent.append({ prop: 'text-align', value: 'right' });
        break;
      case 2:
        parent.append({ prop: 'text-align', value: 'center' });
        break;
      case 3:
        parent.append({ prop: 'text-align', value: 'justify' });
        break;
      case 0:
        parent.append({ prop: 'text-align', value: 'left' });
        break;
    }
    if (layer.style.textStyle.NSParagraphStyle.style.maximumLineHeight !== 0) {
      parent.append({
        prop: 'line-height',
        value: (0, _helpers.convUnit)(layer.style.textStyle.NSParagraphStyle.style.maximumLineHeight)
      });
    }
    var font = _lodash2.default.get(layer.style, 'textStyle.NSFont.family');
    var fontName = layer.style.textStyle.NSFont.name.toLowerCase();
    if (fontName.indexOf('italic') !== -1) parent.append({
      prop: 'font-style',
      value: 'italic'
    });
    if (fontName.indexOf('bold') !== -1) parent.append({
      prop: 'font-weight',
      value: 'bold'
    });
    if (font !== '.SF NS Text') parent.append({ prop: 'font-family', value: '\'' + _lodash2.default.get(layer.style, 'textStyle.NSFont.family') + '\'' });
    parent.append({
      prop: 'font-size',
      value: (0, _helpers.convUnit)(_lodash2.default.get(layer.style, 'textStyle.NSFont.attributes.NSFontSizeAttribute'))
    });
    parent.append({ prop: 'color', value: (0, _helpers.convRGBA)(layer.style.textStyle.NSColor.color) });
  }

  // Borders
  if (layer.style && layer.style.borders.length && _lodash2.default.find(layer.style.borders, ['isEnabled', 1])) {
    parser.processBorder(_lodash2.default.find(layer.style.borders, ['isEnabled', 1]), parent);
    //parent.append(extractBorder(_.find(layer.style.borders, ['isEnabled', 1])));
  }

  // Radius
  if (_lodash2.default.find(layer.layers, ['name', 'Path'])) {
    var _path = _lodash2.default.find(layer.layers, ['name', 'Path']);
    if (_path.fixedRadius) parent.append({ prop: 'border-radius', value: (0, _helpers.convUnit)(_path.fixedRadius) });
  }

  // Do the box shadow...
  if (_lodash2.default.find(layer.style.shadows, ['isEnabled', 1])) {
    var shadow = _lodash2.default.find(layer.style.shadows, ['isEnabled', 1]);
    var shadowRule = (0, _helpers.convUnit)(shadow.offsetX);
    shadowRule += ' ' + (0, _helpers.convUnit)(shadow.offsetY);
    shadowRule += ' ' + (0, _helpers.convUnit)(shadow.blurRadius);
    shadowRule += ' ' + (0, _helpers.convUnit)(shadow.spread);
    shadowRule += ' ' + shadow.color.value;
    parent.append({
      prop: 'box-shadow',
      value: shadowRule
    });
  }
};

// Local imports...


module.exports = (0, _postcss.plugin)('postcss-backwards', function (opts) {
  opts = opts || {};
  return function (css, result) {

    (0, _loader.clearLoaderCache)();

    var addedDep = false;

    // Runs through all of the nodes (declorations) in the file
    css.walkDecls(function (decl) {
      if (decl.value.indexOf('sketch(') !== -1) {
        var parsedValue = (0, _postcssValueParser2.default)(decl.value);

        var file = parsedValue.nodes[0].nodes[0].value;

        // Resolve the file reference.
        var fileRef = _path3.default.join(_path3.default.dirname(decl.source.input.file), file);

        // Retrieve the sketch JSON dump
        var sketchData = (0, _loader.getSketchJSON)(_path3.default.resolve(fileRef));

        // Add a dependency.
        if (!addedDep) {
          result.messages.push({ type: 'dependency', file: fileRef, parent: css.source.input.file });
          addedDep = true;
        }

        // Symbols
        if (parsedValue.nodes[1].value.indexOf('.symbol.deep') == 0) {
          var symbolName = parsedValue.nodes[1].value.substr(13);
          var symbols = _lodash2.default.find(sketchData.pages, ['name', 'Symbols']);
          var symbol = _lodash2.default.find(symbols.layers, ['name', symbolName]);
          //console.log(symbols);
          if (!symbol) {
            decl.warn(result, 'Missing symbol: ' + symbolName);
          } else {
            sketchLayerToMixed(symbol, decl.parent);
            // Finally remove it...
            decl.remove();
          }
        } else {
          // Symbols
          if (parsedValue.nodes[1].value.indexOf('.symbol') == 0) {
            var _symbolName = parsedValue.nodes[1].value.substr(8);
            var _symbols = _lodash2.default.find(sketchData.pages, ['name', 'Symbols']);
            var _symbol = _lodash2.default.find(_symbols.layers, ['name', _symbolName]);
            //console.log(symbols);
            if (!_symbol) {
              decl.warn(result, 'Missing symbol: ' + _symbolName);
            } else {
              sketchLayerToMixed(_symbol, decl.parent, false);
              // Finally remove it...
              decl.remove();
            }
          }
        }

        // Shared Styles
        if (parsedValue.nodes[1].value.indexOf('.sharedStyle') == 0) {
          var sharedStyleName = parsedValue.nodes[1].value.substr(13);
          var style = _lodash2.default.find(sketchData.layerStyles.objects, ['name', sharedStyleName]);
          if (!style) {
            decl.warn(result, 'Missing shared style: ' + sharedStyleName);
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
                    gradRule = 'radial-gradient(' + (0, _helpers.percentUnit)(fill.gradient.from.x) + ' ' + (0, _helpers.percentUnit)(fill.gradient.to.y) + ', ';
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
              var shadowRule = (0, _helpers.convUnit)(shadow.offsetX);
              shadowRule += ' ' + (0, _helpers.convUnit)(shadow.offsetY);
              shadowRule += ' ' + (0, _helpers.convUnit)(shadow.blurRadius);
              shadowRule += ' ' + (0, _helpers.convUnit)(shadow.spread);
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
            decl.warn(result, 'Missing text style: ' + textStyleName);
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
                  value: (0, _helpers.convRGBA)(_lodash2.default.get(_style.value, 'textStyle.NSColor.color'))
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