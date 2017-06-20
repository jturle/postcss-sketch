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

    var weight = 400;

    if (fontName.indexOf('light') !== -1) weight = 300;
    if (fontName.indexOf('medium') !== -1) weight = 500;
    if (
        fontName.indexOf('bold') !== -1 &&
        (fontName.indexOf('semi') !== -1 || fontName.indexOf('demi') !== -1)
    )
        weight = 600;
    if (fontName.indexOf('bold') !== -1) weight = 700;
    if (fontName.indexOf('heavy') !== -1 || fontName.indexOf('black') !== -1)
        weight = 900;

    rules.push({
        prop: 'font-weight',
        value: weight
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

    // Add text-align for anything that isnt left
    if (textStyle.NSParagraphStyle.style.alignment) {
        var alignment = void 0;
        switch (textStyle.NSParagraphStyle.style.alignment) {
            case 1:
                alignment = 'right';
                break;
            case 2:
                alignment = 'center';
                break;
            case 3:
                alignment = 'justify';
                break;
            default:
                alignment = 'left';
                break;
        }
        rules.push({ prop: 'text-align', value: alignment });
    }

    // Do the font color
    rules.push({
        prop: 'color',
        value: (0, _helpers.convRGBA)(textStyle.NSColor.color)
    });
    return rules;
};
