import _ from 'lodash';
import * as parser from './';
import {convRGBA, convUnit, percentUnit} from '../helpers';

const sketchLayerToMixed = (layer, parent, nest = true, parentLayer = null) => {
    if (layer.hasBackgroundColor && layer.includeBackgroundColorInExport) {
        parent.append({prop: 'background-color', value: layer.backgroundColor.value});
    } else {
        // Background/Fills
        if (layer.style && layer.style.fills.length && _.find(layer.style.fills, ['isEnabled', 1])) {
            parent.append(parser.extractBackground(_.find(layer.style.fills, ['isEnabled', 1])));
        }
    }

    if (nest && layer.layers) {
        layer.layers.forEach((childLayer) => {
            if (['text', 'container', 'Path'].indexOf(childLayer.name) == -1) {
                let newParent = parent.cloneBefore();
                newParent.removeAll();
                newParent.selector += ' :global(.' + childLayer.name + ')';
                sketchLayerToMixed(childLayer, newParent, nest, layer);
            }
            let boundingLayer = _.find(layer.layers, ['name', 'container']) || layer;
            //console.log('BoundingLayer', boundingLayer.name);
            if (childLayer.name == 'container')
                sketchLayerToMixed(childLayer, parent, nest, layer);
            if (childLayer.name == 'text')
                sketchLayerToMixed(childLayer, parent, nest, boundingLayer);
        });
    }

    // Frame
    const resizingConstraint = layer.resizingConstraint;
    let shape = layer.frame;
    parent.append({prop: 'box-sizing', value: 'border-box'});
    let FLAG_A = 1; // 0001
    let FLAG_B = 2; // 0010
    let FLAG_C = 4; // 0100
    let FLAG_D = 8; // 1000
    let FLAG_E = 16; // 0100
    let FLAG_F = 32; // 1000
    let FLAG_G = 64; // 1000
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
            parent.append({prop: 'padding-left', value: convUnit(layer.frame.x - parentLayer.frame.x)});
        if ((resizingConstraint & FLAG_F) == 0)
            parent.append({prop: 'padding-top', value: convUnit(layer.frame.y - parentLayer.frame.y)});
        if ((resizingConstraint & FLAG_D) == 0) {
            parent.append({
                prop: 'padding-bottom',
                value: convUnit(parentLayer.frame.y + parentLayer.frame.height - layer.frame.y - layer.frame.height)
            });
        }
        if ((resizingConstraint & FLAG_A) == 0) {
            parent.append({
                prop: 'padding-right',
                value: convUnit(parentLayer.frame.x + parentLayer.frame.width - layer.frame.x - layer.frame.width)
            });
        }
    }
    if (layer.name == 'container') {
        if ((resizingConstraint & FLAG_B) == 0)
            parent.append({prop: 'width', value: convUnit(layer.frame.width)});
        if ((resizingConstraint & FLAG_E) == 0)
            parent.append({prop: 'height', value: convUnit(layer.frame.height)});

        // Margins
        if (layer.frame.x !== 0)
            parent.append({prop: 'margin-left', value: convUnit(layer.frame.x)});
        if (layer.frame.y !== 0)
            parent.append({prop: 'margin-top', value: convUnit(layer.frame.y)});
        let marginRight = parentLayer.frame.width - layer.frame.x - layer.frame.width;
        if (marginRight !== 0)
            parent.append({prop: 'margin-right', value: convUnit(marginRight)});
        let marginBottom = parentLayer.frame.height - layer.frame.y - layer.frame.height;
        if (marginBottom !== 0)
            parent.append({prop: 'margin-bottom', value: convUnit(marginBottom)});
    }

    // Font color
    if (layer.style && layer.style.textStyle) {
        let alignment = layer.style.textStyle.NSParagraphStyle.style.alignment;
        switch (alignment) {
            case 1:
                parent.append({prop: 'text-align', value: 'right'});
                break;
            case 2:
                parent.append({prop: 'text-align', value: 'center'});
                break;
            case 3:
                parent.append({prop: 'text-align', value: 'justify'});
                break;
            case 0:
                parent.append({prop: 'text-align', value: 'left'});
                break;
        }
        if (layer.style.textStyle.NSParagraphStyle.style.maximumLineHeight !== 0) {
            parent.append({
                prop: 'line-height',
                value: convUnit(layer.style.textStyle.NSParagraphStyle.style.maximumLineHeight)
            });
        }
        let font = _.get(layer.style, 'textStyle.NSFont.family');
        let fontName = layer.style.textStyle.NSFont.name.toLowerCase();
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
            parent.append({prop: 'font-family', value: '\'' + _.get(layer.style, 'textStyle.NSFont.family') + '\''});
        parent.append({
            prop: 'font-size',
            value: convUnit(_.get(layer.style, 'textStyle.NSFont.attributes.NSFontSizeAttribute'))
        });
        parent.append({prop: 'color', value: convRGBA(layer.style.textStyle.NSColor.color)});
    }

    // Borders
    if (layer.style && layer.style.borders.length && _.find(layer.style.borders, ['isEnabled', 1])) {
        parser.processBorder(_.find(layer.style.borders, ['isEnabled', 1]), parent);
        //parent.append(extractBorder(_.find(layer.style.borders, ['isEnabled', 1])));
    }

    // Radius
    if (_.find(layer.layers, ['name', 'Path'])) {
        let path = _.find(layer.layers, ['name', 'Path']);
        if (path.fixedRadius)
            parent.append({prop: 'border-radius', value: convUnit(path.fixedRadius)});
    }

    // Do the box shadow...
    if (_.find(layer.style.shadows, ['isEnabled', 1])) {
        let shadow = _.find(layer.style.shadows, ['isEnabled', 1]);
        let shadowRule = convUnit(shadow.offsetX);
        shadowRule += ' ' + convUnit(shadow.offsetY);
        shadowRule += ' ' + convUnit(shadow.blurRadius);
        shadowRule += ' ' + convUnit(shadow.spread);
        shadowRule += ' ' + shadow.color.value;
        parent.append({
            prop: 'box-shadow',
            value: shadowRule
        });
    }

};

export default sketchLayerToMixed;