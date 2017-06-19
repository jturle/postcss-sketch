import _ from 'lodash';
import * as parser from './';
import { convRGBA, convUnit, percentUnit, appendRules } from '../helpers';

const sketchLayerToMixed = (layer, parent, nest = true, parentLayer = null) => {
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
            _.find(layer.style.fills, ['isEnabled', 1])
        ) {
            appendRules(
                parent,
                parser.fill(_.find(layer.style.fills, ['isEnabled', 1]))
            );
        }
    }

    if (layer.layers) {
        layer.layers.forEach(childLayer => {
            if (
                nest &&
                ['text', 'container', 'Path'].indexOf(childLayer.name) == -1
            ) {
                let newParent = parent.cloneBefore();
                newParent.removeAll();
                let childName = childLayer.name;
                if (childName.substring(0, 1) !== ':')
                    newParent.selector += ' :global(.' + childName + ')';
                else newParent.selector += childName;
                sketchLayerToMixed(childLayer, newParent, nest, layer);
            }
            let boundingLayer =
                _.find(layer.layers, ['name', 'container']) || layer;
            //console.log('BoundingLayer', boundingLayer.name);
            if (childLayer.name == 'container')
                sketchLayerToMixed(childLayer, parent, nest, layer);
            if (childLayer.name == 'text')
                sketchLayerToMixed(childLayer, parent, nest, boundingLayer);
        });
    }

    // Padding & Margins
    if (layer.frame && parentLayer) {
        appendRules(
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
        let alignment = layer.style.textStyle.NSParagraphStyle.style.alignment;
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
                value: convUnit(
                    layer.style.textStyle.NSParagraphStyle.style
                        .maximumLineHeight
                )
            });
        }

        appendRules(parent, parser.textStyle(layer.style.textStyle));
    }

    // Borders
    if (
        layer.style &&
        layer.style.borders.length &&
        _.find(layer.style.borders, ['isEnabled', 1])
    ) {
        appendRules(
            parent,
            parser.border(_.find(layer.style.borders, ['isEnabled', 1]))
        );
    }

    // Radius
    let path = _.find(layer.layers, ['name', 'Path']);
    if (path) appendRules(parent, parser.path(path));

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
