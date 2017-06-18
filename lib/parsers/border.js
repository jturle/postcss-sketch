'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _helpers = require('../helpers');

exports.default = function(border) {
    return [
        {
            prop: 'border-width',
            value: (0, _helpers.convUnit)(border.thickness)
        },
        {
            prop: 'border-style',
            value: 'solid'
        },
        {
            prop: 'border-color',
            value: border.color.value
        }
    ];
};
