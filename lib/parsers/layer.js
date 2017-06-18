'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _2 = require('./');

var parser = _interopRequireWildcard(_2);

var _helpers = require('../helpers');

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

var sketchLayerToMixed = function sketchLayerToMixed(layer, parent) {
    var nest = arguments.length > 2 && arguments[2] !== undefined
        ? arguments[2]
        : true;
    var parentLayer = arguments.length > 3 && arguments[3] !== undefined
        ? arguments[3]
        : null;

    if (layer.hasBackgroundColor && layer.includeBackgroundColorInExport) {
        parent.append({
            prop: 'background-color',
            value: layer.backgroundColor.value
        });
    } else {
        // Background/Fills
        if (
            layer.style &&
            layer.style.fills.length &&
            _lodash2.default.find(layer.style.fills, ['isEnabled', 1])
        ) {
            parent.append(
                parser.extractBackground(
                    _lodash2.default.find(layer.style.fills, ['isEnabled', 1])
                )
            );
        }
    }

    if (nest && layer.layers) {
        layer.layers.forEach(function(childLayer) {
            if (['text', 'container', 'Path'].indexOf(childLayer.name) == -1) {
                var newParent = parent.cloneBefore();
                newParent.removeAll();
                newParent.selector += ' :global(.' + childLayer.name + ')';
                sketchLayerToMixed(childLayer, newParent, nest, layer);
            }
            var boundingLayer =
                _lodash2.default.find(layer.layers, ['name', 'container']) ||
                layer;
            //console.log('BoundingLayer', boundingLayer.name);
            if (childLayer.name == 'container')
                sketchLayerToMixed(childLayer, parent, nest, layer);
            if (childLayer.name == 'text')
                sketchLayerToMixed(childLayer, parent, nest, boundingLayer);
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
        if ((resizingConstraint & FLAG_C) == 0)
            parent.append({
                prop: 'padding-left',
                value: (0, _helpers.convUnit)(
                    layer.frame.x - parentLayer.frame.x
                )
            });
        if ((resizingConstraint & FLAG_F) == 0)
            parent.append({
                prop: 'padding-top',
                value: (0, _helpers.convUnit)(
                    layer.frame.y - parentLayer.frame.y
                )
            });
        if ((resizingConstraint & FLAG_D) == 0) {
            parent.append({
                prop: 'padding-bottom',
                value: (0, _helpers.convUnit)(
                    parentLayer.frame.y +
                        parentLayer.frame.height -
                        layer.frame.y -
                        layer.frame.height
                )
            });
        }
        if ((resizingConstraint & FLAG_A) == 0) {
            parent.append({
                prop: 'padding-right',
                value: (0, _helpers.convUnit)(
                    parentLayer.frame.x +
                        parentLayer.frame.width -
                        layer.frame.x -
                        layer.frame.width
                )
            });
        }
    }
    if (layer.name == 'container') {
        if ((resizingConstraint & FLAG_B) == 0)
            parent.append({
                prop: 'width',
                value: (0, _helpers.convUnit)(layer.frame.width)
            });
        if ((resizingConstraint & FLAG_E) == 0)
            parent.append({
                prop: 'height',
                value: (0, _helpers.convUnit)(layer.frame.height)
            });

        // Margins
        if (layer.frame.x !== 0)
            parent.append({
                prop: 'margin-left',
                value: (0, _helpers.convUnit)(layer.frame.x)
            });
        if (layer.frame.y !== 0)
            parent.append({
                prop: 'margin-top',
                value: (0, _helpers.convUnit)(layer.frame.y)
            });
        var marginRight =
            parentLayer.frame.width - layer.frame.x - layer.frame.width;
        if (marginRight !== 0)
            parent.append({
                prop: 'margin-right',
                value: (0, _helpers.convUnit)(marginRight)
            });
        var marginBottom =
            parentLayer.frame.height - layer.frame.y - layer.frame.height;
        if (marginBottom !== 0)
            parent.append({
                prop: 'margin-bottom',
                value: (0, _helpers.convUnit)(marginBottom)
            });
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
        if (
            layer.style.textStyle.NSParagraphStyle.style.maximumLineHeight !== 0
        ) {
            parent.append({
                prop: 'line-height',
                value: (0, _helpers.convUnit)(
                    layer.style.textStyle.NSParagraphStyle.style
                        .maximumLineHeight
                )
            });
        }
        var font = _lodash2.default.get(layer.style, 'textStyle.NSFont.family');
        var fontName = layer.style.textStyle.NSFont.name.toLowerCase();
        if (fontName.indexOf('italic') !== -1)
            parent.append({
                prop: 'font-style',
                value: 'italic'
            });
        if (fontName.indexOf('bold') !== -1)
            parent.append({
                prop: 'font-weight',
                value: 'bold'
            });
        if (font !== '.SF NS Text')
            parent.append({
                prop: 'font-family',
                value:
                    "'" +
                        _lodash2.default.get(
                            layer.style,
                            'textStyle.NSFont.family'
                        ) +
                        "'"
            });
        parent.append({
            prop: 'font-size',
            value: (0, _helpers.convUnit)(
                _lodash2.default.get(
                    layer.style,
                    'textStyle.NSFont.attributes.NSFontSizeAttribute'
                )
            )
        });
        parent.append({
            prop: 'color',
            value: (0, _helpers.convRGBA)(layer.style.textStyle.NSColor.color)
        });
    }

    // Borders
    if (
        layer.style &&
        layer.style.borders.length &&
        _lodash2.default.find(layer.style.borders, ['isEnabled', 1])
    ) {
        parser.processBorder(
            _lodash2.default.find(layer.style.borders, ['isEnabled', 1]),
            parent
        );
        //parent.append(extractBorder(_.find(layer.style.borders, ['isEnabled', 1])));
    }

    // Radius
    if (_lodash2.default.find(layer.layers, ['name', 'Path'])) {
        var path = _lodash2.default.find(layer.layers, ['name', 'Path']);
        if (path.fixedRadius)
            parent.append({
                prop: 'border-radius',
                value: (0, _helpers.convUnit)(path.fixedRadius)
            });
    }

    // Do the box shadow...
    if (_lodash2.default.find(layer.style.shadows, ['isEnabled', 1])) {
        var shadow = _lodash2.default.find(layer.style.shadows, [
            'isEnabled',
            1
        ]);
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

exports.default = sketchLayerToMixed;
