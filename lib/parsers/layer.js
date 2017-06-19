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

    // Background/Fills
    if (layer.hasBackgroundColor && layer.includeBackgroundColorInExport) {
        parent.append({
            prop: 'background-color',
            value: layer.backgroundColor.value
        });
    } else {
        if (
            layer.style &&
            layer.style.fills.length &&
            _lodash2.default.find(layer.style.fills, ['isEnabled', 1])
        ) {
            (0, _helpers.appendRules)(
                parent,
                parser.fill(
                    _lodash2.default.find(layer.style.fills, ['isEnabled', 1])
                )
            );
        }
    }

    if (layer.layers) {
        layer.layers.forEach(function(childLayer) {
            if (
                nest &&
                ['text', 'container', 'Path'].indexOf(childLayer.name) == -1
            ) {
                var newParent = parent.cloneBefore();
                newParent.removeAll();
                var childName = childLayer.name;
                if (childName.substring(0, 1) !== ':')
                    newParent.selector += ' :global(.' + childName + ')';
                else newParent.selector += childName;
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

    // Padding & Margins
    if (layer.frame && parentLayer) {
        (0, _helpers.appendRules)(
            parent,
            parser.frame(
                layer.name,
                layer.frame,
                parentLayer.frame,
                layer.resizingConstraint
            )
        );
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

        (0, _helpers.appendRules)(
            parent,
            parser.textStyle(layer.style.textStyle)
        );
    }

    // Borders
    if (
        layer.style &&
        layer.style.borders.length &&
        _lodash2.default.find(layer.style.borders, ['isEnabled', 1])
    ) {
        (0, _helpers.appendRules)(
            parent,
            parser.border(
                _lodash2.default.find(layer.style.borders, ['isEnabled', 1])
            )
        );
    }

    // Radius
    var path = _lodash2.default.find(layer.layers, ['name', 'Path']);
    if (path) (0, _helpers.appendRules)(parent, parser.path(path));

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
