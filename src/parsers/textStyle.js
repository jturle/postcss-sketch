import { convUnit, convRGBA } from '../helpers';

export default textStyle => {
    let rules = [];
    let font = textStyle.NSFont.family;
    let fontName = textStyle.NSFont.name.toLowerCase();
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
        value: convUnit(textStyle.NSFont.attributes.NSFontSizeAttribute)
    });
    rules.push({
        prop: 'color',
        value: convRGBA(textStyle.NSColor.color)
    });
    return rules;
};
