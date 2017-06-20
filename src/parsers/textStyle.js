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

    let weight = 400;

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
        value: convUnit(textStyle.NSFont.attributes.NSFontSizeAttribute)
    });

    if (textStyle.NSParagraphStyle.style.minimumLineHeight)
        rules.push({
            prop: 'line-height',
            value: convUnit(textStyle.NSParagraphStyle.style.minimumLineHeight)
        });

    // Add text-align for anything that isnt left
    if (textStyle.NSParagraphStyle.style.alignment) {
        let alignment;
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
        value: convRGBA(textStyle.NSColor.color)
    });
    return rules;
};
