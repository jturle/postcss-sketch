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
    if (fontName.indexOf('light') !== -1)
        rules.push({
            prop: 'font-weight',
            value: '300'
        });
    if (fontName.indexOf('medium') !== -1)
        rules.push({
            prop: 'font-weight',
            value: '500'
        });
    if (
        fontName.indexOf('bold') !== -1 &&
        (fontName.indexOf('semi') !== -1 || fontName.indexOf('demi') !== -1)
    )
        rules.push({
            prop: 'font-weight',
            value: '600'
        });
    if (fontName.indexOf('bold') !== -1)
        rules.push({
            prop: 'font-weight',
            value: '700'
        });
    if (fontName.indexOf('heavy') !== -1 || fontName.indexOf('black') !== -1)
        rules.push({
            prop: 'font-weight',
            value: '900'
        });
    if (font !== '.SF NS Text')
        rules.push({
            prop: 'font-family',
            value: "'" + textStyle.NSFont.family + "'"
        });

    // Do the font size
    rules.push({
        prop: 'font-size',
        value: (0, _helpers.convUnit)(
            textStyle.NSFont.attributes.NSFontSizeAttribute
        )
    });

    if (textStyle.NSParagraphStyle.style.minimumLineHeight)
        rules.push({
            prop: 'line-height',
            value: (0, _helpers.convUnit)(
                textStyle.NSParagraphStyle.style.minimumLineHeight
            )
        });

    // Do the font color
    rules.push({
        prop: 'color',
        value: (0, _helpers.convRGBA)(textStyle.NSColor.color)
    });
    return rules;
};
