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
    (0, _helpers.appendRules)(parent, parser.textStyle(layer.style.textStyle));

    return rules;
};
