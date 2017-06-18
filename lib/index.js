'use strict';

var _postcss = require('postcss');

var _postcss2 = _interopRequireDefault(_postcss);

var _postcssValueParser = require('postcss-value-parser');

var _postcssValueParser2 = _interopRequireDefault(_postcssValueParser);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _helpers = require('./helpers');

var _loader = require('./loader');

var _parsers = require('./parsers');

var parser = _interopRequireWildcard(_parsers);

function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
        return obj;
    } else {
        var newObj = {};
        if (obj != null) {
            for (var key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key))
                    newObj[key] = obj[key];
            }
        }
        newObj.default = obj;
        return newObj;
    }
}

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

module.exports = (0, _postcss.plugin)('postcss-sketch', function(opts) {
    opts = opts || {};
    if (_lodash2.default.get(opts, 'debugMode', false))
        (0, _loader.enableDebugMode)();
    if (_lodash2.default.get(opts, 'noCache', false))
        (0, _loader.disableCache)();
    return function(css, result) {
        (0, _loader.clearLoaderCache)();

        var addedDep = false;

        // Runs through all of the nodes (declorations) in the file
        css.walkDecls(function(decl) {
            if (decl.value.indexOf('sketch(') !== -1) {
                var parsedValue = (0, _postcssValueParser2.default)(decl.value);

                var file = parsedValue.nodes[0].nodes[0].value;

                // Resolve the file reference.
                var fileRef = void 0;
                if (decl.source.input.file)
                    fileRef = _path2.default.join(
                        _path2.default.dirname(decl.source.input.file),
                        file
                    ); // Relative to CSS File
                else fileRef = _path2.default.join(file); // No CSS file, probably testing

                // Retrieve the sketch JSON dump
                var sketchData = (0, _loader.getSketchJSON)(
                    _path2.default.resolve(fileRef)
                );

                // Add a dependency.
                if (!addedDep) {
                    result.messages.push({
                        type: 'dependency',
                        file: fileRef,
                        parent: css.source.input.file
                    });
                    addedDep = true;
                }
                // Symbols
                if (parsedValue.nodes[1].value.indexOf('.symbol') === 0) {
                    if (
                        parsedValue.nodes[1].value.indexOf('.symbol.deep') === 0
                    ) {
                        var symbolName = parsedValue.nodes[1].value.substr(13);
                        var symbols = _lodash2.default.find(sketchData.pages, [
                            'name',
                            'Symbols'
                        ]);
                        var symbol = _lodash2.default.find(symbols.layers, [
                            'name',
                            symbolName
                        ]);
                        if (!symbol) {
                            decl.warn(
                                result,
                                'Missing symbol deep: ' + symbolName
                            );
                        } else {
                            parser.processLayer(symbol, decl.parent);
                            // Finally remove it...
                            decl.remove();
                        }
                    } else {
                        // Symbols
                        var _symbolName = parsedValue.nodes[1].value.substr(8);
                        var _symbols = _lodash2.default.find(sketchData.pages, [
                            'name',
                            'Symbols'
                        ]);
                        var _symbol = _lodash2.default.find(_symbols.layers, [
                            'name',
                            _symbolName
                        ]);
                        if (!_symbol) {
                            decl.warn(result, 'Missing symbol: ' + _symbolName);
                        } else {
                            parser.processLayer(_symbol, decl.parent, false);
                            // Finally remove it...
                            decl.remove();
                        }
                    }
                }

                // Shared Styles
                if (parsedValue.nodes[1].value.indexOf('.sharedStyle') === 0) {
                    var sharedStyleName = parsedValue.nodes[1].value.substr(13);
                    var style = _lodash2.default.find(
                        sketchData.layerStyles.objects,
                        ['name', sharedStyleName]
                    );
                    if (!style) {
                        decl.warn(
                            result,
                            'Missing shared style: ' + sharedStyleName
                        );
                    } else {
                        // Do the font color...
                        if (
                            _lodash2.default.has(
                                style.value,
                                'contextSettings.opacity'
                            ) &&
                            _lodash2.default.get(
                                style.value,
                                'contextSettings.opacity',
                                1
                            ) < 1
                        ) {
                            decl.cloneBefore({
                                prop: 'opacity',
                                value: _lodash2.default.get(
                                    style.value,
                                    'contextSettings.opacity',
                                    1
                                )
                            });
                        }

                        // Do the background...
                        var fill = _lodash2.default.find(style.value.fills, [
                            'isEnabled',
                            1
                        ]);
                        if (fill) {
                            if (fill.fillType === 0) {
                                // Background-color
                                decl.cloneBefore({
                                    prop: 'background-color',
                                    value: _lodash2.default.get(
                                        fill,
                                        'color.value'
                                    )
                                });
                            }

                            if (fill.fillType === 1) {
                                // Gradient
                                var gradRule = void 0;
                                /* eslint-disable */
                                switch (fill.gradient.gradientType) {
                                    default:
                                    case 0:
                                        gradRule = 'linear-gradient(90deg, ';
                                        break;
                                    case 1:
                                        gradRule =
                                            'radial-gradient(' +
                                            (0, _helpers.percentUnit)(
                                                fill.gradient.from.x
                                            ) +
                                            ' ' +
                                            (0, _helpers.percentUnit)(
                                                fill.gradient.to.y
                                            ) +
                                            ', ';
                                        break;
                                }
                                /* eslint-enable */
                                fill.gradient.stops.forEach(function(
                                    stop,
                                    idx
                                ) {
                                    if (idx > 0) gradRule += ', ';
                                    gradRule +=
                                        stop.color.value +
                                        ' ' +
                                        Math.round(stop.position * 100) +
                                        '%';
                                });
                                gradRule += ')';
                                decl.cloneBefore({
                                    prop: 'background-image',
                                    value: gradRule
                                });
                            }
                        }

                        // Do the border...
                        var border = _lodash2.default.find(
                            style.value.borders,
                            ['isEnabled', 1]
                        );
                        if (border) {
                            decl.cloneBefore({
                                prop: 'border',
                                value:
                                    _lodash2.default.get(border, 'thickness') +
                                        'px solid ' +
                                        _lodash2.default.get(
                                            border,
                                            'color.value'
                                        )
                            });
                        }

                        // Do the box shadow...
                        var shadow = _lodash2.default.find(
                            style.value.shadows,
                            ['isEnabled', 1]
                        );
                        if (shadow) {
                            var shadowRule = (0, _helpers.convUnit)(
                                shadow.offsetX
                            );
                            shadowRule +=
                                ' ' + (0, _helpers.convUnit)(shadow.offsetY);
                            shadowRule +=
                                ' ' + (0, _helpers.convUnit)(shadow.blurRadius);
                            shadowRule +=
                                ' ' + (0, _helpers.convUnit)(shadow.spread);
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
                if (parsedValue.nodes[1].value.indexOf('.textStyle') === 0) {
                    var textStyleName = parsedValue.nodes[1].value.substr(11);
                    var _style = _lodash2.default.find(
                        sketchData.layerTextStyles.objects,
                        ['name', textStyleName]
                    );
                    if (!_style) {
                        decl.warn(
                            result,
                            'Missing text style: ' + textStyleName
                        );
                    } else {
                        // Do the font family & size...
                        var fontName = _lodash2.default.get(
                            _style.value.textStyle,
                            'NSFont.family'
                        );
                        /* eslint-disable */
                        decl.parent.append({
                            prop: 'font-family',
                            value: "'" + fontName + "'"
                        });
                        /* eslint-enable */
                        decl.parent.append({
                            prop: 'font-size',
                            value: (0, _helpers.convUnit)(
                                _lodash2.default.get(
                                    _style.value.textStyle,
                                    'NSFont.attributes.NSFontSizeAttribute'
                                )
                            )
                        });

                        // Do the font color...
                        if (
                            _lodash2.default.has(
                                _style.value,
                                'textStyle.NSColor.color'
                            )
                        ) {
                            var color = _postcss2.default.decl({
                                prop: 'color',
                                value: (0, _helpers.convRGBA)(
                                    _lodash2.default.get(
                                        _style.value,
                                        'textStyle.NSColor.color'
                                    )
                                )
                            });
                            decl.parent.append(color);
                        }

                        // Remove original
                        decl.remove();
                    }
                }
            }
        });
    };
});

// Local imports...
/* eslint-disable complexity */
