'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _helpers = require('../helpers');

exports.default = function(textStyle) {
    var rules = [];
    var font = textStyle.NSFont.family;
    var fontName = textStyle.NSFont.name.toLowerCase();
    if (fontName.indexOf('italic') !== -1)
        rules.push({
            prop: 'font-style',
            value: 'italic'
        });
    if (fontName.indexOf('bold') !== -1)
        rules.push({
            prop: 'font-weight',
            value: 'bold'
        });
    if (font !== '.SF NS Text')
        rules.push({
            prop: 'font-family',
            value: "'" + textStyle.NSFont.family + "'"
        });
    rules.push({
        prop: 'font-size',
        value: (0, _helpers.convUnit)(
            textStyle.NSFont.attributes.NSFontSizeAttribute
        )
    });
    return rules;
};
